# NeighborPeace ⚖️

**NeighborPeace** is a decentralized dispute resolution and violation penalty contract system for apartment complexes or neighborhoods. Residents pool their funds on-chain, and GenLayer AI validators serve as a subjective community jury to evaluate audio/visual evidence (decibel logs, photo proofs) to penalize rule violators, compensating affected neighbors directly.

---

## 🛠️ Key Features

* **Communal Escrow Bond**: Residents lock security stakes (escrows) in mock USDC. Violators have fines deducted directly from their bond.
* **AI Jury Consensus**: GenLayer nodes act as subjective community arbitrators.
  * **Noise violation check**: Evaluates sound log/log streams to detect noise exceeding 70dB after 10:00 PM.
  * **Littering audit**: Audits visual photo logs and waste evidence descriptions to verify rule breaking and attribute it to a specific unit.
* **Automatic Reimbursement**: Fines deducted from guilty offenders are split, transferring 80% to the complainant as compensation, and 20% to the civic treasury pool.
* **Premium Mint-Green Palette**: Custom slate-dark background with glowing mint green accents (`#00F6A2`).

---

## 📁 Repository Structure

```bash
├── contracts/
│   └── NeighborPeace.py         # Intelligent GenLayer Smart Contract
└── frontend/
    ├── src/
    │   ├── app/                 # Next.js pages & styling setup
    │   └── lib/                 # Web3 GenLayer client connectors
    └── .env.local               # Local environment configurations
```

---

## 🚀 Run Locally

### 1. Smart Contract Verification
Verify AST syntax parser check:
```bash
python -c "import ast; ast.parse(open('contracts/NeighborPeace.py', encoding='utf-8').read())"
```

### 2. Frontend Launch
Run the frontend server on port `3050`:
```bash
cd frontend
npm install
npm run dev -- -p 3050
```

Open [http://localhost:3050](http://localhost:3050) in your browser.

---

## 🔗 Deployed Contracts & Live Demos

* **Deployed Contract Address**: `0x016174D1115f9423F7c66258c16Fe01cC7031E3c` on GenLayer Studio (Studionet)
* **Live Vercel Application**: [https://neighborpeace-frontend.vercel.app](https://neighborpeace-frontend.vercel.app)
