definition = (
  head:stmt
  tail:(ws m:stmt { return m; })*
  { return [head].concat(tail); }
)

stmt = perm / decl / comment

perm
  = perm_ident
    begin_paren
    actor:rec_selector
    value_separator
    perms:perms_ls
    value_separator
    resource:rec_selector
    end_paren
  {
  	return {
      type: "permission_def",
      actor: actor,
      permissions: perms,
      resource: resource,
    }
  }

perm_ident = "has_permission"

rec_selector = rec_selector_filter / ident_val
 
rec_selector_filter
  = name:ident_val
    begin_paren
    members:(
      head:filter_member
      tail:(value_separator m:filter_member { return m; })*
      {
        var result: Record<string, any> = {};
        [head].concat(tail).forEach(function(element) {
          result[element.name] = element.value;
        });
        return result;
      }
    )?
    end_paren
    {
    	return {
        name: name,
        filters: members !== null ? members: {}
     	}
	}

filter_member
  = name:ident eq_sep value:(string / number) {
      return { name: name, value: value };
    }

decl
  = ws type:("host" / "actor" / "resource") ws name:ident ws begin_object
    members:(
      head:decl_member
      tail:(value_separator m:decl_member { return m; })*
      {
        var result: Record<string, any> = {};
        [head].concat(tail).forEach(function(element) {
          result[element.name] = element.value;
        });
        return result;
      }
    )?
    end_object
    {
    	return {
        	type:type,
            name: name,
			members: members !== null ? members: {}
     	}
	}

decl_member
  = name:ident eq_sep value:JSON_text {
      return { name: name, value: value };
    }

ident_val "Identifier" = e:([A-Za-z_]+) { return e.join("") }
ident     = ident_val / string

perms_ls "permissions list"
  = begin_array
    values:(
      head:value
      tail:(value_separator v:string { return v; })*
      { return [head].concat(tail); }
    )?
    end_array
    { return values !== null ? values : []; }

eq_sep = ws "=" ws
comment = ws "#" val:([^\n\r]*) {
  return {
  	type: "comment",
    val: val.join("")
  }
}

// JSON

JSON_text
  = ws value:value ws { return value; }

begin_array     = ws "[" ws
begin_object    = ws "{" ws
end_array       = ws "]" ws
end_object      = ws "}" ws
name_separator  = ws ":" ws
value_separator = ws "," ws
begin_paren     = ws "(" ws
end_paren       = ws ")" ws

ws "whitespace" = [ \t\n\r]*

// Values

value
  = false
  / null
  / true
  / object
  / array
  / number
  / string

false = "false" { return false; }
null  = "null"  { return null;  }
true  = "true"  { return true;  }

// Objects

object
  = begin_object
    members:(
      head:member
      tail:(value_separator m:member { return m; })*
      {
        var result: Record<string, any> = {};
        [head].concat(tail).forEach(function(element) {
          result[element.name] = element.value;
        });
        return result;
      }
    )?
    end_object
    { return members !== null ? members: {}; }

member
  = name:string name_separator value:value {
      return { name: name, value: value };
    }

// Arrays

array
  = begin_array
    values:(
      head:value
      tail:(value_separator v:value { return v; })*
      { return [head].concat(tail); }
    )?
    end_array
    { return values !== null ? values : []; }

// Numbers

number "number"
  = minus? int frac? exp? { return parseFloat(text()); }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero / (digit1_9 DIGIT*)

minus
  = "-"

plus
  = "+"

zero
  = "0"

// Strings

string "string"
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = '"'

unescaped
  = [^\0-\x1F\x22\x5C]

// Core ABNF Rules

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i