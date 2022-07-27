/*** Patterns ***/

// Address patterns
const zipPattern = String.raw`\d{5}(?:-\d{4})?`
const cityPattern = String.raw`(?:[A-Z][a-z.-]+[ ]?){0,70}`
const statePattern = String.raw`Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New[ ]Hampshire|New[ ]Jersey|New[ ]Mexico|New[ ]York|North[ ]Carolina|North[ ]Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode[ ]Island|South[ ]Carolina|South[ ]Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West[ ]Virginia|Wisconsin|Wyoming`
const stateAbbrvPattern = String.raw`AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY`
const cityStateZipPattern = String.raw`${cityPattern},\s*(?:${statePattern}|${stateAbbrvPattern}),?\s*${zipPattern}`
const streetSuffixPattern = String.raw`Alley|Allee|Ally|Aly|Annex|Anex|Annx|Anx|Arcade|Arc|Avenue|Av|Ave|Aven|Avenu|Avn|Avnue|Bayou`
+ `|Bayoo|Byu|Beach|Bch|Bend|Bnd|Bluff|Bluf|Blf|Bluffs|Blfs|Bottom|Bot|Bottm|Btm|Boulevard|Boul`
+ `|Boulv|Blvd|Branch|Brnch|Br|Bridge|Brdge|Brg|Brook|Brk|Brooks|Brks|Burg|Bg|Burgs|Bgs|Bypass`
+ `|Bypa|Bypas|Byps|Byp|Camp|Cmp|Cp|Canyon|Canyn|Cnyn|Cyn|Cape|Cpe|Causeway|Causwa|Cswy|Center`
+ `|Cen|Cent|Centr|Centre|Cnter|Cntr|Ctr|Centers|Ctrs|Circle|Circ|Circl|Crcl|Crcle|Cir|Circles`
+ `|Cirs|Cliff|Clf|Cliffs|Clfs|Club|Clb|Common|Cmn|Commons|Cmns|Corner|Cor|Corners|Cors|Course`
+ `|Crse|Court|Ct|Courts|Cts|Cove|Cv|Coves|Cvs|Creek|Crk|Crescent|Crsent|Crsnt|Cres|Crest|Crst`
+ `|Crossing|Crssng|Xing|Crossroad|Xrd|Curve|Curv|Dale|Dl|Dam|Dm|Divide|Div|Dvd|Dv|Drive|Driv`
+ `|Drv|Dr|Drives|Drs|Estate|Est|Estates|Ests|Expressway|Exp|Expr|Express|Expw|Expy|Extension`
+ `|Extn|Extnsn|Ext|Extensions|Exts|Fall|Falls|Fls|Ferry|Frry|Fry|Field|Fld|Fields|Flds|Flat`
+ `|Flt|Flats|Flts|Ford|Frd|Fords|Frds|Forest|Frst|Forge|Forg|Frg|Forges|Frgs|Fork|Frk|Forks`
+ `|Frks|Fort|Frt|Ft|Freeway|Freewy|Frway|Frwy|Fwy|Garden|Gardn|Grden|Grdn|Gdn|Gardens|Gdns`
+ `|Gateway|Gatewy|Gatway|Gtway|Gtwy|Glen|Gln|Glens|Glns|Green|Grn|Greens|Grns|Grove|Grov|Grv`
+ `|Groves|Grvs|Harbor|Harb|Harbr|Hrbor|Hbr|Harbors|Hbrs|Haven|Hvn|Heights|Hts|Highway|Highwy`
+ `|Hiway|Hiwy|Hway|Hwy|Hill|Hl|Hills|Hls|Hollow|Hllw|Holw|Holws|Inlet|Inlt|Island|Is|Islands`
+ `|Iss|Isle|Junction|Jction|Jctn|Junctn|Juncton|Jct|Junctions|Jcts|Key|Ky|Keys|Kys|Knoll|Knol`
+ `|Knl|Knolls|Knls|Lake|Lk|Lakes|Lks|Land|Landing|Lndng|Lndg|Lane|Ln|Light|Lgt|Lights|Lgts|Loaf`
+ `|Lf|Lock|Lck|Locks|Lcks|Lodge|Ldge|Lodg|Ldg|Loop|Lp|Mall|Manor|Mnr|Manors|Mnrs|Meadow|Mdw`
+ `|Meadows|Medows|Mdws|Mews|Mill|Ml|Mills|Mls|Mission|Msn|Motorway|Mtwy|Mount|Mt|Mountain|Mtn`
+ `|Mountains|Mtns|Neck|Nck|Orchard|Orchrd|Orch|Oval|Ovl|Overpass|Opas|Park|Prk|Parks|Park|Parkway`
+ `|Parkwy|Pkway|Pky|Pkwy|Parkways|Pkwys|Pass|Passage|Psge|Path|Pike|Pine|Pne|Pines|Pnes|Place|Pl`
+ `|Plain|Pln|Plains|Plns|Plaza|Plza|Plz|Point|Pt|Points|Pts|Port|Prt|Ports|Prts|Prairie|Prr|Pr`
+ `|Radial|Rad|Radiel|Radl|Ramp|Ranch|Rnch|Rnchs|Rapid|Rpd|Rapids|Rpds|Rest|Rst|Ridge|Rdge|Rdg`
+ `|Ridges|Rdgs|River|Rvr|Rivr|Riv|Road|Rd|Roads|Rds|Route|Rte|Row|Rue|Run|Shoal|Shl|Shoals|Shls`
+ `|Shore|Shr|Shores|Shrs|Skyway|Skwy|Spring|Spng|Sprng|Spg|Springs|Spgs|Spur|Square|Sqr|Sqre|Squ`
+ `|Sq|Squares|Sqs|Station|Statn|Stn|Sta|Strasse|Stravenue|Strav|Straven|Stravn|Strvn|Strvnue|Stra`
+ `|Stream|Streme|Strm|Street|Str|Strt|St|Streets|Sts|Summit|Sumit|Sumitt|Smt|Terrace|Terr|Ter`
+ `|Throughway|Trwy|Trace|Trce|Track|Trak|Trk|Trks|Trafficway|Trfy|Trail|Trl|Trailer|Trlr|Tunnel`
+ `|Tunl|Turnpike|Trnpk|Turnpk|Tpke|Underpass|Upas|Union|Un|Unions|Uns|Valley|Vally|Vlly|Vly`
+ `|Valleys|Vlys|Via|Viaduct|Vdct|Viadct|Via|View|Vw|Views|Vws|Village|Vill|Villag|Villg|Vlg`
+ `|Villages|Vlgs|Ville|Vl|Vista|Vist|Vst|Vsta|Vis|Walk|Wall|Way|Wy|Well|Wl|Wells|Wls`
const directionPattern = String.raw`(?:[nN](?:orth)?|[eE](?:ast)?|[sS](?:outh)?|[wW](?:est)?)\.?`
const streetPattern = String.raw`\d{1,4} [\w\s]{1,50}(?:\b${streetSuffixPattern}\b)\.?(?:[ ]${directionPattern})?`
const addressPattern = String.raw`(?:${streetPattern}\s${cityStateZipPattern})|(?:${streetPattern})|(?:${cityStateZipPattern})`;

// Driver License patterns
const dlPatternMap: Record<string, string> = {
  "AL": String.raw`\b\d{7}\b`,
  "AZ": String.raw`\b[a-zA-Z][0-9]{8}\b|\b[0-9]{9}\b`,
  "AR": String.raw`\b9[0-9]{8}\b`,
  "CA": String.raw`\b[a-zA-Z][0-9]{7}\b`,
  "CO": String.raw`\b[0-9]{2}-[0-9]{3}-[0-9]{4}\b`,
  "FL": String.raw`\b[a-zA-Z][0-9]{12}\b|\b[a-zA-Z][0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{3}-[0-9]\b|\b[a-zA-Z]-[0-9]{3}-[0-9]{3}-[0-9]{3}-[0-9]{3}\b`,
  "ID": String.raw`\b[a-zA-Z]{2}[0-9]{6}[a-zA-Z]\b`,
  "IL": String.raw`\b[a-zA-Z][0-9]{11}\b|\b[a-zA-Z][0-9]{3}-[0-9]{4}-[0-9]{4}\b`,
  "IN": String.raw`\b[0-9]{4}-[0-9]{2}-[0-9]{4}\b`,
  "IA": String.raw`\b[0-9]{3}[a-zA-Z]{2}[0-9]{4}\b`,
  "KS": String.raw`\b[a-zA-Z][0-9]{2}-[0-9]{2}-[0-9]{4}\b`,
  "KY": String.raw`\b[a-zA-Z][0-9]{2}-[0-9]{3}-[0-9]{3}\b`,
  "MA": String.raw`\bS[0-9]{8}\b|\bSA[0-9]{7}\b`,
  "MI": String.raw`\b[a-zA-Z][ ][0-9]{3}[ ][0-9]{3}[ ][0-9]{3}[ ][0-9]{3}\b`,
  "MN": String.raw`\b[a-zA-Z][0-9]{3}-[0-9]{3}-[0-9]{3}-[0-9]{3}\b`,
  "MS": String.raw`\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b`,
  "MT": String.raw`\b(?:(?:[0][1-9]|[1][0-2])[0-9]{3}(?:[1-9][0-9]{3})41(?:[0][1-9]|[1][0-9]|[2][0-9]|[3][0-1]))\b`,
  "NV": String.raw`\b[0-9]{10}\b|\b[0-9]{12}\b`,
  "NH": String.raw`\b(?:[0][1-9]|[1][0-2])[a-zA-Z]{3}[0-9]{2}(?:0[1-9]|[1-2][0-9]|3[0-1])[0-9]\b`,
  "NJ": String.raw`\b[a-zA-Z][0-9]{4} [0-9]{5} [0-9]{5}\b|\b[a-zA-Z][0-9]{14}\b`,
  "NY": String.raw`\b[0-9]{3} [0-9]{3} [0-9]{3}\b`,
  "ND": String.raw`\b[a-zA-Z]{3}-[0-9]{2}-[0-9]{4}\b|\b[a-zA-Z][0-9]{9}\b`,
  "OH": String.raw`\b[a-zA-Z]{2}[0-9]{6}\b`,
  "PA": String.raw`\b[0-9]{2} [0-9]{3} [0-9]{3}\b`,
  "RI": String.raw`\b[1-9]{2}[0-9]{5}\b`,
  "SD": String.raw`\b[0-9]{8}\b`,
  "VT": String.raw`\b[0-9]{7}[a-zA-Z]\b`,
  "WA": String.raw`\b[a-zA-Z\*]{5}[a-zA-Z]{2}[0-9]{3}[a-zA-Z0-9]{2}\b|\bWDL[a-zA-Z0-9]{9}\b`,
  "WV": String.raw`\b[a-zA-Z][0-9]{6}\b`,
  "WI": String.raw`\b[a-zA-Z][0-9]{3}-[0-9]{4}-[0-9]{4}-[0-9]{2}\b|\b[a-zA-Z][0-9]{13}\b`,
  "WY": String.raw`\b[0-9]{6}-[0-9]{3}\b`,
}
const driverLicensePattern = Object.values(dlPatternMap).join("|")

// Geographic Coordinate patterns
const	latitudePattern = String.raw`[-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?)`;
const longitudePattern = String.raw`[-+]?(?:180(?:\.0+)?|(?:(?:1[0-7]\d)|(?:[1-9]?\d))(?:\.\d+)?)`
const coordinatePattern = String.raw`\b${latitudePattern}\s*,\s*${longitudePattern}\b`

// Birthday patterns (min: 1900, max: 2099)
const yyyyMmDd = String.raw`\b(?:19\d{2}|20[01][0-9]|20\d{2})[-/.](?:0[1-9]|1[012])[-/.](?:0[1-9]|[12][0-9]|3[01])\b`
const mmDdYyyy = String.raw`\b(?:0[1-9]|1[012])[-/.](?:0[1-9]|[12][0-9]|3[01])[-/.](?:19\d{2}|20[01][0-9]|20\d{2})\b`
const ddMmYyyy = String.raw`\b(?:0[1-9]|[12][0-9]|3[01])[-/.](?:0[1-9]|1[012])[-/.](?:19\d{2}|20[01][0-9]|20\d{2})\b`
const dobPattern = String.raw`${yyyyMmDd}|${mmDdYyyy}|${ddMmYyyy}`

// IP address patterns
const ipV4Pattern = String.raw`\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b`

// Credit card patterns
const americanExpressPattern = String.raw`\b3[47][0-9]{13}\b|\b3[47][0-9]{2}-[0-9]{6}-[0-9]{5}\b|\b3[47][0-9]{2}[ ][0-9]{6}[ ][0-9]{5}\b`
const visaPattern = String.raw`\b4[0-9]{12}(?:[0-9]{3})?\b|\b4[0-9]{3}-[0-9]{4}-[0-9]{4}-[0-9]{4}\b|\b4[0-9]{3}[ ][0-9]{4}[ ][0-9]{4}[ ][0-9]{4}\b`
const	mastercardPattern = String.raw`\b5[1-5][0-9]{14}\b|\b(?:222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[0-1]\d|2720)[0-9]{12}\b`
const	discoverPattern = String.raw`\b6(?:011\d{12,15}|5\d{14,17}|4[4-9]\d{13,16}|22(?:1(?:2[6-9]|[3-9]\d)|[2-8]\d{2}|9(?:[01]\d|2[0-5]))\d{10,13})\b`
const	jcbPattern = String.raw`\b(?:2131|1800|35[0-9]{3})[0-9]{11}\b`
const	creditCardPattern = String.raw`${americanExpressPattern}|${visaPattern}|${mastercardPattern}|${discoverPattern}|${jcbPattern}`


// Email patterns
const emailPattern = String.raw`(?:[a-z0-9!#$%&'*+/=?^_` + "`" + String.raw`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_` + "`" + String.raw`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])`

// SSN patterns
const ssnPattern = String.raw`\b(?!000|666|333|9[0-9]{2})[0-9]{3}[- ]?(?!00)[0-9]{2}[- ]?(?!0000)[0-9]{4}\b`

// Phone number patterns
const phoneNumberPattern = String.raw`\b(?:(?:(?<![\d-])(?:\+?\d{1,3}[-.\s*]?)?(?:\(?\d{3}\)?[-.\s*]?)?\d{3}[-.\s*]?\d{4}(?![\d-]))|(?:(?<![\d-])(?:(?:\(\+?\d{2}\))|(?:\+?\d{2}))\s*\d{2}\s*\d{3}\s*\d{4}(?![\d-])))\b`

// Vehicle identification patterns
const vinPattern = String.raw`\b[A-HJ-NPR-Z0-9]{17}\b`


/*** Compiled Regexp ***/
export const ADDRESS_REGEXP = new RegExp(addressPattern, "g");
export const DRIVER_LICENSE_REGEXP = new RegExp(driverLicensePattern, "g")
export const COORDINATE_REGEXP = new RegExp(coordinatePattern, "g")
export const DOB_REGEXP = new RegExp(dobPattern, "g")
export const IP_ADDRESS_REGEXP = new RegExp(ipV4Pattern, "g")
export const CREDIT_CARD_REGEXP = new RegExp(creditCardPattern, "g")
export const EMAIL_REGEXP = new RegExp(emailPattern, "g")
export const SSN_REGEXP = new RegExp(ssnPattern, "g")
export const PHONE_NUMBER_REGEXP = new RegExp(phoneNumberPattern, "g")
export const VIN_REGEXP = new RegExp(vinPattern, "g")
