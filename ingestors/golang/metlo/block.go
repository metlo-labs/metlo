package metlo

import (
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

type RateLimitStateAction int64

const (
	Create RateLimitStateAction = iota
	Reset
	Increment
)

type WafRateLimitDuration struct {
	Hour   uint32 `json:"hour"`
	Minute uint32 `json:"minute"`
	Second uint32 `json:"second"`
}

type WafRateLimit struct {
	Threshold uint16               `json:"threshold"`
	Interval  string               `json:"interval"`
	Duration  WafRateLimitDuration `json:"duration"`
}

type WafAction struct {
	ActionType   string        `json:"actionType"`
	RateLimit    *WafRateLimit `json:"rateLimit"`
	BlockEndTime *int64        `json:"blockEndTime"`
}

type ConditionItem struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Key      string `json:"key"`
	Value    string `json:"value"`
}

type ConditionGroup struct {
	Conditions []ConditionItem `json:"conditions"`
	Rule       string          `json:"rule"`
}

type WafRule struct {
	Uuid            string           `json:"uuid"`
	RuleType        string           `json:"ruleType"`
	TagName         *string          `json:"tagName"`
	Identifiers     *[]string        `json:"identifiers"`
	Action          *WafAction       `json:"action"`
	ConditionGroups []ConditionGroup `json:"conditionGroups"`
}

type Authentication struct {
	Host           string  `json:"host"`
	AuthType       string  `json:"authType"`
	HeaderKey      *string `json:"headerKey"`
	JwtUserPath    *string `json:"jwtUserPath"`
	CookieName     *string `json:"cookieName"`
	UserCookieName *string `json:"userCookieName"`
}

type HostMap struct {
	Host    string `json:"host"`
	Pattern string `json:"pattern"`
}

type AgentConfig struct {
	WafConfig            *[]WafRule        `json:"wafConfig"`
	AuthenticationConfig *[]Authentication `json:"authenticationConfig"`
	HostMap              *[]HostMap        `json:"hostMap"`
}

type HostMapCompiled struct {
	Host    string
	Pattern *regexp.Regexp
}

type WafConfig struct {
	WafRules             []WafRule
	AuthenticationConfig []Authentication
	HostMap              []HostMapCompiled
	mutex                sync.RWMutex
}

type RateLimitWindow struct {
	Prev uint16
	Curr uint16
}

type RateLimitEntry struct {
	Threshold         uint16
	Duration          uint32
	DurationStart     *time.Time
	ThresholdStart    time.Time
	ThresholdInterval string
	Window            RateLimitWindow
}

type RateLimitMap struct {
	entries map[string]RateLimitEntry
	mutex   sync.RWMutex
}

var wafConfig WafConfig
var rateLimitMap RateLimitMap

func GetXForwardedForFromValue(value *string) *string {
	if value == nil {
		return nil
	}
	splitValues := strings.Split(*value, ",")
	if len(splitValues) > 0 {
		res := strings.TrimSpace(splitValues[0])
		return &res
	}
	return nil
}

func GetSourceIp(reqHeaders []NV, traceMeta TraceMeta) *string {
	for _, header := range reqHeaders {
		if strings.ToLower(header.Name) == "x-forwarded-for" {
			xForwardedValue := GetXForwardedForFromValue(&header.Value)
			return xForwardedValue
		}
	}
	return &traceMeta.Source
}

func CheckStringCondition(condOperator *string, condValue *string, reqValue *string) bool {
	if condOperator == nil || condValue == nil || reqValue == nil {
		return false
	}
	switch *condOperator {
	case "eq":
		return *reqValue == *condValue
	case "contains":
		return strings.Contains(*reqValue, *condValue)
	case "startswith":
		return strings.HasPrefix(*reqValue, *condValue)
	case "endswith":
		return strings.HasSuffix(*reqValue, *condValue)
	case "nt_eq":
		return *reqValue != *condValue
	case "nt_startswith":
		return !strings.HasPrefix(*reqValue, *condValue)
	case "nt_endswith":
		return !strings.HasSuffix(*reqValue, *condValue)
	case "nt_contains":
		return !strings.Contains(*reqValue, *condValue)
	}
	return false
}

func GetKeyValuePairValue(key string, keyValuePairs []NV) *string {
	for _, pair := range keyValuePairs {
		if strings.ToLower(pair.Name) == key {
			return &pair.Name
		}
	}
	return nil
}

func GetCookiesFromString(cookieString string) []*http.Cookie {
	request := http.Request{}
	request.Header = make(http.Header)
	request.Header.Set("Cookie", cookieString)
	return request.Cookies()
}

func CheckUser(condOperator *string, condValue *string, authentication *Authentication, user *string, headers []NV) bool {
	if condOperator == nil || condValue == nil {
		return false
	}
	if user != nil {
		return CheckStringCondition(condOperator, condValue, user)
	} else if authentication != nil && authentication.UserCookieName != nil {
		headerValuePtr := GetKeyValuePairValue("cookie", headers)
		if headerValuePtr == nil {
			return false
		}
		headerValue := *headerValuePtr
		for _, parsedCookie := range GetCookiesFromString(headerValue) {
			if *authentication.UserCookieName == parsedCookie.Name {
				return CheckStringCondition(condOperator, condValue, &parsedCookie.Value)
			}
		}
		return false
	}
	return false
}

func CheckStatusCode(condOperator *string, condStatusCode *string, reqStatusCode *int) bool {
	if condOperator == nil || condStatusCode == nil || reqStatusCode == nil {
		return false
	}
	parsedCondStatus, err := strconv.Atoi(*condStatusCode)
	if err != nil {
		return false
	}
	switch *condOperator {
	case "lt":
		return *reqStatusCode < parsedCondStatus
	case "gt":
		return *reqStatusCode > parsedCondStatus
	case "eq":
		return *reqStatusCode == parsedCondStatus
	case "nt_eq":
		return *reqStatusCode != parsedCondStatus
	}
	return false
}

func CheckKeyValuePair(condOperator *string, condKey *string, condValue *string, keyValuePairs []NV) bool {
	if condOperator == nil || condKey == nil || condValue == nil {
		return false
	}
	for _, pair := range keyValuePairs {
		if strings.ToLower(pair.Name) == strings.ToLower(*condKey) && CheckStringCondition(condOperator, condValue, &pair.Value) {
			return true
		}
	}
	return false
}

func GetConditionBoolean(req TraceReq, traceMeta TraceMeta, condition ConditionItem, authentication *Authentication, statusCode *int) bool {
	switch condition.Field {
	case "path":
		formattedCondPath := strings.TrimRight(condition.Value, "/")
		formattedReqPath := strings.TrimRight(req.Url.Path, "/")
		return CheckStringCondition(&condition.Operator, &formattedCondPath, &formattedReqPath)
	case "method":
		return CheckStringCondition(&condition.Operator, &condition.Value, &req.Method)
	case "status_code":
		return CheckStatusCode(&condition.Operator, &condition.Value, statusCode)
	case "request_header":
		return CheckKeyValuePair(&condition.Operator, &condition.Key, &condition.Value, req.Headers)
	case "request_parameter":
		return CheckKeyValuePair(&condition.Operator, &condition.Key, &condition.Value, req.Url.Parameters)
	case "request_body":
		return CheckStringCondition(&condition.Operator, &condition.Value, &req.Body)
	case "ip_address":
		sourceIp := GetSourceIp(req.Headers, traceMeta)
		return CheckStringCondition(&condition.Operator, &condition.Value, sourceIp)
	case "user":
		return CheckUser(&condition.Operator, &condition.Value, authentication, req.User, req.Headers)
	default:
		return false
	}
}

func IsConditionGroupMatch(req TraceReq, traceMeta TraceMeta, conditionGroup ConditionGroup, authentication *Authentication, statusCode *int) bool {
	switch conditionGroup.Rule {
	case "all":
		isMatch := true
		for _, condition := range conditionGroup.Conditions {
			isMatch = isMatch && GetConditionBoolean(req, traceMeta, condition, authentication, statusCode)
		}
		return isMatch
	case "one":
		for _, condition := range conditionGroup.Conditions {
			if GetConditionBoolean(req, traceMeta, condition, authentication, statusCode) {
				return true
			}
		}
		return false
	default:
		return false
	}
}

func HandleBlockRule(req TraceReq, traceMeta TraceMeta, conditionGroups []ConditionGroup, authentication *Authentication, statusCode *int) bool {
	block := true
	for _, group := range conditionGroups {
		block = block && IsConditionGroupMatch(req, traceMeta, group, authentication, statusCode)
	}
	return block
}

func GetIntervalDuration(thresholdInterval string) time.Duration {
	switch thresholdInterval {
	case "minute_1":
		return time.Second * time.Duration(60)
	case "minute_5":
		return time.Minute * time.Duration(5)
	case "minute_10":
		return time.Minute * time.Duration(10)
	case "minute_15":
		return time.Minute * time.Duration(15)
	case "minute_30":
		return time.Minute * time.Duration(30)
	case "hour_1":
		return time.Minute * time.Duration(60)
	default:
		return time.Second * time.Duration(1)
	}
}

func GetWindowInfo(thresholdInterval string, thresholdStart time.Time, now time.Time) (float64, float64) {
	secsPassed := now.Sub(thresholdStart).Seconds()
	switch thresholdInterval {
	case "minute_1":
		return 60.0, secsPassed
	case "minute_5":
		return (5.0 * 60.0), secsPassed
	case "minute_10":
		return (10.0 * 60.0), secsPassed
	case "minute_15":
		return (15.0 * 60.0), secsPassed
	case "minute_30":
		return (30.0 * 60.0), secsPassed
	case "hour_1":
		return (60.0 * 60.0), secsPassed
	default:
		return 1.0, 1.0
	}
}

func HandleRateLimitStateAction(ruleAction WafAction, key string, action RateLimitStateAction, entries map[string]RateLimitEntry) {
	switch action {
	case Reset:
		entry, exists := entries[key]
		if exists {
			entry.Window.Prev = entry.Window.Curr
			entry.Window.Curr = 1
			entry.DurationStart = nil
			entry.ThresholdStart = entry.ThresholdStart.Add(GetIntervalDuration(entry.ThresholdInterval))
			entries[key] = entry
		} else if ruleAction.RateLimit != nil {
			rateLimitAction := *ruleAction.RateLimit
			entries[key] = RateLimitEntry{
				Threshold:         rateLimitAction.Threshold,
				Duration:          (rateLimitAction.Duration.Hour * 3600) + (rateLimitAction.Duration.Minute * 60) + (rateLimitAction.Duration.Second),
				DurationStart:     nil,
				ThresholdStart:    time.Now(),
				ThresholdInterval: rateLimitAction.Interval,
				Window:            RateLimitWindow{Prev: 0, Curr: 1},
			}
		}
		break
	case Increment:
		entry, exists := entries[key]
		if exists {
			if time.Since(entry.ThresholdStart) > GetIntervalDuration(entry.ThresholdInterval) {
				entry.Window.Prev = entry.Window.Curr
				entry.Window.Curr = 1
				entry.ThresholdStart = time.Now()
				entry.DurationStart = nil
				entries[key] = entry
			} else {
				now := time.Now()
				entry.Window.Curr += 1
				intervalLength, secsPassed := GetWindowInfo(entry.ThresholdInterval, entry.ThresholdStart, now)
				reqCount := float64(entry.Window.Prev)*((intervalLength-secsPassed)/intervalLength) + float64(entry.Window.Curr)
				if math.Floor(reqCount) >= float64(entry.Threshold) {
					entry.DurationStart = &now
				}
				entries[key] = entry
			}
		}
		break
	case Create:
		if ruleAction.RateLimit != nil {
			rateLimitAction := *ruleAction.RateLimit
			entries[key] = RateLimitEntry{
				Threshold:         rateLimitAction.Threshold,
				Duration:          (rateLimitAction.Duration.Hour * 3600) + (rateLimitAction.Duration.Minute * 60) + (rateLimitAction.Duration.Second),
				DurationStart:     nil,
				ThresholdStart:    time.Now(),
				ThresholdInterval: rateLimitAction.Interval,
				Window:            RateLimitWindow{Prev: 0, Curr: 1},
			}
		}
		break
	}
}

func HandleUserIdentifier(authentication *Authentication, headers []NV, user *string, key *strings.Builder) {
	if user != nil {
		key.WriteRune('_')
		key.WriteString(*user)
	} else if authentication != nil && authentication.UserCookieName != nil {
		headerValuePtr := GetKeyValuePairValue("cookie", headers)
		if headerValuePtr == nil {
			return
		}
		headerValue := *headerValuePtr
		for _, parsedCookie := range GetCookiesFromString(headerValue) {
			if *authentication.UserCookieName == parsedCookie.Name {
				key.WriteRune('_')
				key.WriteString(parsedCookie.Value)
			}
		}
	}
}

func HandleSessionIdentifier(authentication *Authentication, headers []NV, key *strings.Builder) {
	if authentication == nil {
		return
	}
	switch authentication.AuthType {
	case "basic":
		headerValuePtr := GetKeyValuePairValue("authorization", headers)
		if headerValuePtr == nil {
			return
		}
		headerVal := *headerValuePtr
		if strings.HasPrefix(headerVal, "Basic") {
			split_val := strings.Split(headerVal, "Basic")
			if len(split_val) > 1 {
				key.WriteRune('_')
				key.WriteString(split_val[1])
			}
		}
		break
	case "header", "jwt":
		if authentication.HeaderKey == nil {
			return
		}
		headerKey := *authentication.HeaderKey
		headerValuePtr := GetKeyValuePairValue(strings.ToLower(headerKey), headers)
		if headerValuePtr != nil {
			key.WriteRune('_')
			key.WriteString(*headerValuePtr)
		}
		break
	case "session_cookie":
		if authentication.CookieName != nil {
			headerValuePtr := GetKeyValuePairValue("cookie", headers)
			if headerValuePtr != nil {
				headerValue := *headerValuePtr
				for _, parsedCookie := range GetCookiesFromString(headerValue) {
					if *authentication.CookieName == parsedCookie.Name {
						key.WriteRune('_')
						key.WriteString(parsedCookie.Value)
					}
				}
			}
		}
		break
	}
}

func GetRateLimitKey(rule WafRule, req TraceReq, traceMeta TraceMeta, authentication *Authentication) string {
	var key strings.Builder
	key.WriteString(rule.Uuid)
	if rule.Identifiers != nil {
		for _, ident := range *rule.Identifiers {
			switch ident {
			case "ip":
				sourceIp := GetSourceIp(req.Headers, traceMeta)
				if sourceIp != nil {
					key.WriteRune('_')
					key.WriteString(*sourceIp)
				}
				break
			case "user":
				HandleUserIdentifier(authentication, req.Headers, req.User, &key)
				break
			case "session":
				HandleSessionIdentifier(authentication, req.Headers, &key)
				break
			}
		}
	}
	return key.String()
}

func HandleRateLimitRule(req TraceReq, traceMeta TraceMeta, rule WafRule, authentication *Authentication) bool {
	available := rateLimitMap.mutex.TryRLock()
	if !available {
		return false
	}
	defer rateLimitMap.mutex.RUnlock()

	keyString := GetRateLimitKey(rule, req, traceMeta, authentication)
	if rateLimitMap.entries != nil {
		rateLimit, exists := rateLimitMap.entries[keyString]
		if exists {
			if rateLimit.DurationStart != nil {
				if time.Since(*rateLimit.DurationStart).Seconds() <= float64(rateLimit.Duration) {
					return true
				}
			}
		}
	}
	return false
}

func HandleRateLimitRuleUpdate(data MetloTrace, rule WafRule, authentication *Authentication) {
	shouldBlock := HandleBlockRule(data.Request, data.Meta, rule.ConditionGroups, authentication, &data.Response.Status)
	if !shouldBlock {
		return
	}
	available := rateLimitMap.mutex.TryLock()
	if !available {
		return
	}
	defer rateLimitMap.mutex.Unlock()

	keyString := GetRateLimitKey(rule, data.Request, data.Meta, authentication)
	rateLimitAction := Create
	if rateLimitMap.entries == nil {
		rateLimitMap.entries = make(map[string]RateLimitEntry)
	}
	if rateLimitMap.entries != nil {
		rateLimit, exists := rateLimitMap.entries[keyString]
		if exists {
			if rateLimit.DurationStart != nil {
				if time.Since(*rateLimit.DurationStart).Seconds() <= float64(rateLimit.Duration) {
					return
				}
				rateLimitAction = Reset
			} else {
				rateLimitAction = Increment
			}
		}
		if rule.Action != nil {
			HandleRateLimitStateAction(*rule.Action, keyString, rateLimitAction, rateLimitMap.entries)
		}
	}
}

func (m *metlo) ShouldBlock(req TraceReq, traceMeta TraceMeta) bool {
	block := false
	currTime := time.Now().UnixMilli()
	var authentication *Authentication
	authentication = nil
	currentHost := req.Url.Host
	available := wafConfig.mutex.TryRLock()
	if !available {
		return false
	}
	defer wafConfig.mutex.RUnlock()
	for _, hostMap := range wafConfig.HostMap {
		if hostMap.Pattern.MatchString(currentHost) {
			currentHost = hostMap.Host
			break
		}
	}
	for _, item := range wafConfig.AuthenticationConfig {
		if item.Host == currentHost {
			*authentication = item
		}
	}

	for _, rule := range wafConfig.WafRules {
		switch rule.RuleType {
		case "block":
			if !block &&
				((rule.Action.BlockEndTime != nil && currTime <= *rule.Action.BlockEndTime) || rule.Action.BlockEndTime == nil) &&
				HandleBlockRule(req, traceMeta, rule.ConditionGroups, authentication, nil) {
				block = true
			}
			break
		case "rate_limit":
			res := HandleRateLimitRule(req, traceMeta, rule, authentication)
			if !block && res {
				block = true
			}
			break
		}
	}
	return block
}

func (m *metlo) UpdateRateLimit(data MetloTrace) {
	var authentication *Authentication
	authentication = nil
	currentHost := data.Request.Url.Host
	available := wafConfig.mutex.TryRLock()
	if !available {
		return
	}
	defer wafConfig.mutex.RUnlock()
	for _, hostMap := range wafConfig.HostMap {
		if hostMap.Pattern.MatchString(currentHost) {
			currentHost = hostMap.Host
			break
		}
	}
	for _, item := range wafConfig.AuthenticationConfig {
		if item.Host == currentHost {
			*authentication = item
		}
	}

	for _, rule := range wafConfig.WafRules {
		switch rule.RuleType {
		case "rate_limit":
			HandleRateLimitRuleUpdate(data, rule, authentication)
			break
		}
	}
}
