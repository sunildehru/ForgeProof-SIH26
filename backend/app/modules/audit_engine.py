"""
Immutable SHA-256 Cryptographic Audit Trail (Layer 4)
Maintains a tamper-evident hash chain of screening cases and officer decisions.
"""

import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

class AuditTrail:
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
        self._genesis_block()
        
    def _genesis_block(self):
        genesis = {
            "entry_id": 0,
            "timestamp": datetime.now().isoformat(),
            "case_id": "SYSTEM_GENESIS",
            "action": "INIT_AUDIT_LEDGER",
            "officer_id": "SYS_ADMIN",
            "verdict": "SYSTEM_INITIALIZED",
            "risk_score": 0.0,
            "notes": "ForgeProof Border Security Audit Ledger Initialized",
            "previous_hash": "0000000000000000000000000000000000000000000000000000000000000000"
        }
        genesis["entry_hash"] = self._compute_hash(genesis)
        self.chain.append(genesis)
        
    def _compute_hash(self, entry: Dict[str, Any]) -> str:
        payload = (
            f"{entry['entry_id']}_{entry['timestamp']}_{entry['case_id']}_"
            f"{entry['action']}_{entry['officer_id']}_{entry['verdict']}_"
            f"{entry['risk_score']}_{entry.get('notes', '')}_{entry['previous_hash']}"
        )
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def record_event(
        self,
        case_id: str,
        action: str,
        officer_id: str,
        verdict: str,
        risk_score: float,
        notes: str = ""
    ) -> Dict[str, Any]:
        """Appends a new cryptographically chained audit record."""
        prev_entry = self.chain[-1]
        new_entry = {
            "entry_id": len(self.chain),
            "timestamp": datetime.now().isoformat(),
            "case_id": case_id,
            "action": action,
            "officer_id": officer_id,
            "verdict": verdict,
            "risk_score": risk_score,
            "notes": notes,
            "previous_hash": prev_entry["entry_hash"]
        }
        new_entry["entry_hash"] = self._compute_hash(new_entry)
        self.chain.append(new_entry)
        return new_entry

    def get_logs_for_case(self, case_id: str) -> List[Dict[str, Any]]:
        return [entry for entry in self.chain if entry["case_id"] == case_id or entry["case_id"] == "SYSTEM_GENESIS"]

    def get_all_logs(self) -> List[Dict[str, Any]]:
        return self.chain

    def verify_integrity(self) -> Dict[str, Any]:
        """Verifies the complete hash chain from genesis to head."""
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            
            # Check previous hash pointer
            if curr["previous_hash"] != prev["entry_hash"]:
                return {
                    "is_tampered": True,
                    "valid": False,
                    "error_at_index": i,
                    "detail": f"Hash pointer broken between block {i-1} and {i}"
                }
                
            # Recompute hash
            recalc = self._compute_hash(curr)
            if recalc != curr["entry_hash"]:
                return {
                    "is_tampered": True,
                    "valid": False,
                    "error_at_index": i,
                    "detail": f"Block {i} data has been altered! Stored hash does not match computed hash."
                }
                
        return {
            "is_tampered": False,
            "valid": True,
            "total_blocks": len(self.chain),
            "head_hash": self.chain[-1]["entry_hash"] if self.chain else None,
            "status": "Cryptographic ledger verified. Zero alterations detected."
        }

# Global in-memory audit ledger instance
audit_ledger = AuditTrail()
