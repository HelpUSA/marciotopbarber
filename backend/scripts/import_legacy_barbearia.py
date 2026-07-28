"""
Script de importação/migração do arquivo barbearia.sql para a nova plataforma Márcio TopBarber.
Extrai registros das tabelas legadas:
- clientes -> Customer
- funcionarios -> Barber / User
- servicos -> Service
- produtos -> Product
- agendamentos -> Appointment
"""

import re
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

LEGACY_SQL_PATH = Path("D:/dev/AntiG/barbearia/barbearia.sql")
OUTPUT_JSON_PATH = Path("D:/dev/AntiG/marciotopbarber/backend/scripts/imported_legacy_data.json")

def parse_sql_inserts(sql_content, table_name):
    pattern = re.compile(
        rf"INSERT INTO `{table_name}` \(([^)]+)\) VALUES\s*([\s\S]+?);",
        re.IGNORECASE
    )
    matches = pattern.findall(sql_content)
    records = []
    
    for columns_str, values_block in matches:
        columns = [c.strip(" `") for c in columns_str.split(",")]
        raw_tuples = re.findall(r"\((.*?)\)(?:,\s*|\s*$)", values_block, re.DOTALL)
        for raw in raw_tuples:
            vals = []
            cur = ""
            in_quote = False
            for char in raw:
                if char == "'" and (not cur or cur[-1] != "\\"):
                    in_quote = not in_quote
                elif char == "," and not in_quote:
                    vals.append(cur.strip(" '\""))
                    cur = ""
                    continue
                cur += char
            if cur:
                vals.append(cur.strip(" '\""))
            
            if len(vals) == len(columns):
                records.append(dict(zip(columns, vals)))
    return records

def convert_legacy():
    if not LEGACY_SQL_PATH.exists():
        print(f"❌ Arquivo SQL não encontrado em: {LEGACY_SQL_PATH}")
        return
        
    sql_text = LEGACY_SQL_PATH.read_text(encoding="utf-8", errors="ignore")
    
    clients = parse_sql_inserts(sql_text, "clientes")
    employees = parse_sql_inserts(sql_text, "funcionarios")
    services = parse_sql_inserts(sql_text, "servicos")
    products = parse_sql_inserts(sql_text, "produtos")
    appointments = parse_sql_inserts(sql_text, "agendamentos")
    
    summary = {
        "clients_count": len(clients),
        "employees_count": len(employees),
        "services_count": len(services),
        "products_count": len(products),
        "appointments_count": len(appointments),
        "sample_clients": clients[:3],
        "sample_services": services[:3],
    }
    
    OUTPUT_JSON_PATH.write_text(json.dumps({
        "clients": clients,
        "employees": employees,
        "services": services,
        "products": products,
        "appointments": appointments
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    
    print("✅ Extração de dados legados concluída com sucesso!")
    print(f"📊 Resumo: {json.dumps(summary, indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    convert_legacy()
