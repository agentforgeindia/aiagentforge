#!/usr/bin/env python3
"""
patch-n8n-textile-credits.py
============================
Fixes the deduct_credits / refund_credits RPC calls in the textile
n8n workflow so they hit the NEW 4-argument signature
  (p_user_id uuid, p_amount bigint, p_reason text, p_generation_id text)
instead of the old 3-arg version that caused PGRST203 ambiguity.

Changes:
1. Supabase - Deduct Credits
     • Add p_reason = "textile_generate"
2. Supabase - Refund Credits
     • Body was empty → now populated with all 4 params.
"""

import json
from pathlib import Path

IN = Path(r"C:\Users\User\Downloads\TextilePrints to Mockup 18-05-2026.json")
OUT = Path(r"C:\Users\User\Downloads\TextilePrints to Mockup 18-05-2026 PATCHED.json")


def four_arg_params(reason: str) -> list:
    return [
        {"name": "p_user_id",       "value": "={{ $json.user_id }}"},
        {"name": "p_amount",        "value": "={{ $json.credit_cost }}"},
        {"name": "p_reason",        "value": reason},
        {"name": "p_generation_id", "value": "={{ $json.generation_id }}"},
    ]


def main():
    data = json.loads(IN.read_text(encoding="utf-8"))
    data["name"] = (
        data.get("name", "") + " (credits-RPC fix v2)"
    )

    patched = []
    for node in data["nodes"]:
        name = node.get("name", "")
        params = node.get("parameters", {})

        if name == "Supabase - Deduct Credits":
            params["bodyParameters"] = {
                "parameters": four_arg_params("textile_generate")
            }
            patched.append(name)

        elif name == "Supabase - Refund Credits":
            params["bodyParameters"] = {
                "parameters": four_arg_params(
                    "refund:textile_n8n_failed"
                )
            }
            patched.append(name)

    OUT.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Patched: {patched}")
    print(f"Written: {OUT}")


if __name__ == "__main__":
    main()
