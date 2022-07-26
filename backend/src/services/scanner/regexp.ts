/*** Patterns ***/

// Address Patterns
const zipPattern = String.raw`\d{5}(?:-\d{4})?`
const cityPattern = String.raw`(?:[A-Z][a-z.-]+[ ]?){0,70}`
const statePattern = String.raw`
Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|
Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|
Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New[ ]Hampshire|New[ ]Jersey|New[ ]Mexico
|New[ ]York|North[ ]Carolina|North[ ]Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode[ ]Island
|South[ ]Carolina|South[ ]Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West[ ]Virginia
|Wisconsin|Wyoming
`
const stateAbbrvPattern = String.raw`
AL|AK|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MT
|NE|NV|NH|NJ|NM|NY|NC|ND|MP|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY
`
const cityStateZipPattern = String.raw`${cityPattern},\s*(?:${statePattern}|${stateAbbrvPattern}),?\s*${zipPattern}`
const streetSuffixPattern = String.raw`
Alley|Allee|Ally|Aly|Annex|Anex|Annx|Anx|Arcade|Arc|Avenue|Av|Ave|Aven|Avenu|Avn|Avnue|Bayou
|Bayoo|Byu|Beach|Bch|Bend|Bnd|Bluff|Bluf|Blf|Bluffs|Blfs|Bottom|Bot|Bottm|Btm|Boulevard|Boul
|Boulv|Blvd|Branch|Brnch|Br|Bridge|Brdge|Brg|Brook|Brk|Brooks|Brks|Burg|Bg|Burgs|Bgs|Bypass
|Bypa|Bypas|Byps|Byp|Camp|Cmp|Cp|Canyon|Canyn|Cnyn|Cyn|Cape|Cpe|Causeway|Causwa|Cswy|Center
|Cen|Cent|Centr|Centre|Cnter|Cntr|Ctr|Centers|Ctrs|Circle|Circ|Circl|Crcl|Crcle|Cir|Circles
|Cirs|Cliff|Clf|Cliffs|Clfs|Club|Clb|Common|Cmn|Commons|Cmns|Corner|Cor|Corners|Cors|Course
|Crse|Court|Ct|Courts|Cts|Cove|Cv|Coves|Cvs|Creek|Crk|Crescent|Crsent|Crsnt|Cres|Crest|Crst
|Crossing|Crssng|Xing|Crossroad|Xrd|Curve|Curv|Dale|Dl|Dam|Dm|Divide|Div|Dvd|Dv|Drive|Driv
|Drv|Dr|Drives|Drs|Estate|Est|Estates|Ests|Expressway|Exp|Expr|Express|Expw|Expy|Extension
|Extn|Extnsn|Ext|Extensions|Exts|Fall|Falls|Fls|Ferry|Frry|Fry|Field|Fld|Fields|Flds|Flat
|Flt|Flats|Flts|Ford|Frd|Fords|Frds|Forest|Frst|Forge|Forg|Frg|Forges|Frgs|Fork|Frk|Forks
|Frks|Fort|Frt|Ft|Freeway|Freewy|Frway|Frwy|Fwy|Garden|Gardn|Grden|Grdn|Gdn|Gardens|Gdns
|Gateway|Gatewy|Gatway|Gtway|Gtwy|Glen|Gln|Glens|Glns|Green|Grn|Greens|Grns|Grove|Grov|Grv
|Groves|Grvs|Harbor|Harb|Harbr|Hrbor|Hbr|Harbors|Hbrs|Haven|Hvn|Heights|Hts|Highway|Highwy
|Hiway|Hiwy|Hway|Hwy|Hill|Hl|Hills|Hls|Hollow|Hllw|Holw|Holws|Inlet|Inlt|Island|Is|Islands
|Iss|Isle|Junction|Jction|Jctn|Junctn|Juncton|Jct|Junctions|Jcts|Key|Ky|Keys|Kys|Knoll|Knol
|Knl|Knolls|Knls|Lake|Lk|Lakes|Lks|Land|Landing|Lndng|Lndg|Lane|Ln|Light|Lgt|Lights|Lgts|Loaf
|Lf|Lock|Lck|Locks|Lcks|Lodge|Ldge|Lodg|Ldg|Loop|Lp|Mall|Manor|Mnr|Manors|Mnrs|Meadow|Mdw
|Meadows|Medows|Mdws|Mews|Mill|Ml|Mills|Mls|Mission|Msn|Motorway|Mtwy|Mount|Mt|Mountain|Mtn
|Mountains|Mtns|Neck|Nck|Orchard|Orchrd|Orch|Oval|Ovl|Overpass|Opas|Park|Prk|Parks|Park|Parkway
|Parkwy|Pkway|Pky|Pkwy|Parkways|Pkwys|Pass|Passage|Psge|Path|Pike|Pine|Pne|Pines|Pnes|Place|Pl
|Plain|Pln|Plains|Plns|Plaza|Plza|Plz|Point|Pt|Points|Pts|Port|Prt|Ports|Prts|Prairie|Prr|Pr
|Radial|Rad|Radiel|Radl|Ramp|Ranch|Rnch|Rnchs|Rapid|Rpd|Rapids|Rpds|Rest|Rst|Ridge|Rdge|Rdg
|Ridges|Rdgs|River|Rvr|Rivr|Riv|Road|Rd|Roads|Rds|Route|Rte|Row|Rue|Run|Shoal|Shl|Shoals|Shls
|Shore|Shr|Shores|Shrs|Skyway|Skwy|Spring|Spng|Sprng|Spg|Springs|Spgs|Spur|Square|Sqr|Sqre|Squ
|Sq|Squares|Sqs|Station|Statn|Stn|Sta|Strasse|Stravenue|Strav|Straven|Stravn|Strvn|Strvnue|Stra
|Stream|Streme|Strm|Street|Str|Strt|St|Streets|Sts|Summit|Sumit|Sumitt|Smt|Terrace|Terr|Ter
|Throughway|Trwy|Trace|Trce|Track|Trak|Trk|Trks|Trafficway|Trfy|Trail|Trl|Trailer|Trlr|Tunnel
|Tunl|Turnpike|Trnpk|Turnpk|Tpke|Underpass|Upas|Union|Un|Unions|Uns|Valley|Vally|Vlly|Vly
|Valleys|Vlys|Via|Viaduct|Vdct|Viadct|Via|View|Vw|Views|Vws|Village|Vill|Villag|Villg|Vlg
|Villages|Vlgs|Ville|Vl|Vista|Vist|Vst|Vsta|Vis|Walk|Wall|Way|Wy|Well|Wl|Wells|Wls
`
const directionPattern = String.raw`(?:[nN](?:orth)?|[eE](?:ast)?|[sS](?:outh)?|[wW](?:est)?)\.?`
const streetPattern = String.raw`\d{1,4} [\w\s]{1,50}(?:\b${streetSuffixPattern}\b)\.?(?:[ ]${directionPattern})?`
const addressPattern = String.raw`(${streetPattern}\s${cityStateZipPattern})|(${streetPattern})|(${cityStateZipPattern})`
