# TSA CA certificates

For **openssl ts -verify** (full cryptographic TSA verification):

1. Download FreeTSA CA cert, e.g. from https://www.freetsa.org/
2. Save as `docs/certs/freetsa-cacert.pem`
3. Set `TSA_CA_FILE=docs/certs/freetsa-cacert.pem` when calling verify

Without this file, product only performs **structural** imprint checks and labels `verifyLevel: structural` — never `openssl-verified`.

OTS Bitcoin confirmation requires the official `ots` CLI (`pip install opentimestamps-client`) and `ots verify`.
