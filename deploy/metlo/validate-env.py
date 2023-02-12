#!/usr/bin/env python3

import os
import base64
import sys


ENCRYPTION_KEY_MSG = '''
ENCRYPTION_KEY env var not set... Generate one using the command:
python3 -c 'import base64; import secrets; print(base64.b64encode(secrets.token_bytes(32)).decode("UTF-8"))'
'''.strip()

INVALID_ENCRYPTION_KEY_MSG = '''
Invalid ENCRYPTION_KEY, it must be a 32 byte base64 encoded string... Generate one using the command:
python3 -c 'import base64; import secrets; print(base64.b64encode(secrets.token_bytes(32)).decode("UTF-8"))'
'''.strip()


def main():
    failures = []
    ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")
    if not ENCRYPTION_KEY:
        failures.append(ENCRYPTION_KEY_MSG)
    if ENCRYPTION_KEY and len(base64.b64decode(ENCRYPTION_KEY)) != 32:
        failures.append(INVALID_ENCRYPTION_KEY_MSG)

    if failures:
        print("!!! FAILED TO VALIDATE ENVIRONMENT !!!\n")
        print('\n\n'.join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()