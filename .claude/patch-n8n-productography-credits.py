#!/usr/bin/env python3
"""
patch-n8n-productography-credits.py
===================================
Same shape as the textile patch — adds the missing `p_reason`
parameter to the Productography workflow's two RPC nodes so they
hit the new 4-arg signature
  (p_user_id uuid, p_amount bigint, p_reason text, p_generation_id text)
instead of the old 3-arg one that triggers PGRST203 ambiguity.

Notes:
* The Deduct node already references `$json.*` (current item).
* The Refund node references `$('Validate And Normalize').first().json.*`
  because it runs in the failure branch where `$json` has been
  overwritten by downstream FAL output. We preserve that pattern.
"""

import json
from pathlib import Path

IN = Path(r"C:\Users\User\Downloads\Productography.json")
OUT = Path(r"C:\Users\User\Downloads\Productography PATCHED.json")


def deduct_params() -> list:
    return [
        {"name": "p_user_id",       "value": "={{ $json.user_id }}"},
        {"name": "p_amount",        "value": "={{ $json.credit_cost }}"},
        {"name": "p_reason",        "value": "productography_generate"},
        {"name": "p_generation_id", "value": "={{ $json.generation_id }}"},
    ]


def refund_params() -> list:
    base = "={{ $('Validate And Normalize').first().json"
    return [
        {"name": "p_user_id",       "value": base + ".user_id }}"},
        {"name": "p_amount",        "value": base + ".credit_cost }}"},
        {"name": "p_reason",        "value": "refund:productography_n8n_failed"},
        {"name": "p_generation_id", "value": base + ".generation_id }}"},
    ]


def main():
    data = json.loads(IN.read_text(encoding="utf-8"))
    data["name"] = data.get("name", "") + " (credits-RPC fix v2)"

    patched = []
    for node in data["nodes"]:
        name = node.get("name", "")
        params = node.get("parameters", {})

        if name == "Supabase - Deduct Credits":
            params["bodyParameters"] = {"parameters": deduct_params()}
            patched.append(name)

        elif name == "Supabase - Refund Credits":
            params["bodyParameters"] = {"parameters": refund_params()}
            patched.append(name)

    OUT.write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Patched: {patched}")
    print(f"Written: {OUT}")


if __name__ == "__main__":
    main()
