-- Migration 036: parking proof evidence on orders (admin-approved reimbursement)
-- parking_proof_url: public blob URL uploaded by the driver
-- parking_proof_status: 'pending' | 'approved' | 'rejected' (admin review)
-- parking_proof_rejected_reason: optional admin note
ALTER TABLE orders ADD COLUMN parking_proof_url TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN parking_proof_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN parking_proof_rejected_reason TEXT DEFAULT NULL;
