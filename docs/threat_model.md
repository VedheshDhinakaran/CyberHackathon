# Threat Model

This document describes the threat assumptions, attacker capabilities, and security considerations for the NETRECON network forensic workbench.

## Purpose

NETRECON is designed to analyze packet capture files and support network forensic investigations. It is primarily a forensic tool for analysts to inspect suspicious traffic, reconstruct sessions, extract files, and generate attack timelines.

## Assets

- **Captured network traffic** — the PCAP/PCAPNG files uploaded by the analyst.
- **Extracted artifacts** — reconstructed files, payloads, and metadata derived from captures.
- **Analysis results** — detected events, timeline entries, extracted IOCs, and session metadata.
- **Database** — local SQLite store containing upload history, sessions, files, and timeline events.
- **Web UI** — browser dashboard that displays analysis results.

## Trust Boundaries

- **User environment** — the workstation or server where the tool is executed.
- **Backend process** — FastAPI service parsing captures and writing artifacts.
- **Frontend browser** — UI rendering the analysis results.
- **External tools** — `tshark` and optional `zeek` used for deep packet parsing.

## Threat Actors

- **Malware author / attacker**
  - Creates malformed or malicious PCAPs to exploit parser bugs.
  - Crafts network traffic to evade detection or hide attacker behavior.

- **Insider / analyst**
  - May accidentally load sensitive or compromised captures onto the analysis host.
  - Might use the tool on untrusted infrastructure.

- **Supply chain / dependency attacker**
  - Tampered Python or JavaScript dependencies could execute arbitrary code.

## Threat Scenarios

1. **Malformed PCAP exploit**
   - An attacker crafts a PCAP file that triggers a bug in `dpkt`, `scapy`, `tshark`, or `zeek`.
   - A successful exploit could compromise the analysis host.

2. **Data exposure from extracted artifacts**
   - Sensitive payloads and metadata are stored locally under `backend/data/`.
   - Unauthorized users with filesystem access could view or exfiltrate captured data.

3. **API misuse**
   - The backend exposes endpoints for file uploads and analysis data.
   - If deployed beyond a local trusted environment, these endpoints could be abused.

4. **Dependency compromise**
   - A malicious or outdated package in Python or NPM supply chain introduces risk.

5. **Cross-site attacks**
   - If the frontend is accessed through an untrusted browser or network, it may be exposed to injection risks from display content.

## Security Assumptions

- The tool is run in a trusted, isolated environment by security analysts.
- The user is responsible for protecting the host and network where the tool runs.
- Only trusted local users can upload PCAP files and access the backend API.
- External parser tools like `tshark` and `zeek` are installed from trusted sources.
- The SQLite database and data directories are protected by OS-level access controls.

## Mitigations

- **Run in isolation**
  - Execute the tool on a dedicated analysis machine or VM.
  - Avoid running on production systems.

- **Limit access**
  - Restrict backend API access to localhost or an internal network.
  - Use filesystem permissions to protect `backend/data/`.

- **Validate dependencies**
  - Install Python packages from official sources.
  - Keep `npm` packages and system tools updated.

- **Use trusted captures**
  - Prefer captures from known sources during testing.
  - Treat untrusted PCAPs as potentially malicious.

- **Monitor parser tools**
  - Keep `tshark` and `zeek` up to date to reduce exploitation risk.

## Limitations

- This tool is not a hardened production security gateway.
- It does not include authentication, encryption, or robust access control out of the box.
- The backend API is intended for local use and should not be publicly exposed without additional hardening.
- Uploaded packets and extracted artifacts are stored on disk in plaintext.
- The application assumes the analyst has operational security controls around the host.

## Recommendations for Safe Use

- Run CyberHackathon inside a virtual machine or sandbox.
- Use separate storage for capture files and extracted artifacts.
- Enforce file and directory permissions on the backend data folder.
- Do not trust arbitrary PCAPs without prior vetting.
- Keep all supporting tools and libraries patched.
