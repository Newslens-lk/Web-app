"""Fix Sinhala conjunct rendering by inserting ZWJ where needed."""

import re

# Sinhala consonants that form conjuncts with a preceding hal (්)
_CONJUNCT_RE = re.compile(r"්([රයවලනම])")

def fix_conjuncts(text: str | None) -> str | None:
    if not text:
        return text
    return _CONJUNCT_RE.sub("්\u200d\\1", text)
