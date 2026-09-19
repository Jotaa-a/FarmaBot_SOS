"""
Sincroniza el catálogo de MySQL con Qdrant, generando embeddings reales.

Uso:
    pip install requests mysql-connector-python
    set OPENROUTER_API_KEY=tu_key   (Windows: $env:OPENROUTER_API_KEY="tu_key")
    python sync_mysql_to_qdrant.py

Esto:
1. Lee todos los productos de la tabla `producto` en MySQL (con sus IDs reales).
2. Para cada uno, genera un embedding real del campo `usos` vía OpenRouter.
3. Inserta el punto en Qdrant usando el MISMO id que tiene en MySQL,
   así después puedes cruzar los resultados de Qdrant directo con la tabla.
"""

import os
import requests
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# --- Configuración MySQL ---
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": os.environ.get("MYSQL_PASSWORD", ""),
    "database": "drogueria",
}

# --- Configuración Qdrant ---
QDRANT_URL = "http://localhost:6333"
COLLECTION = "drogueria_catalogo"
VECTOR_SIZE = 1536

# --- Configuración OpenRouter ---
OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
EMBEDDING_MODEL = "google/gemini-embedding-2"


def obtener_productos_mysql():
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, nombre, descripcion, usos, precio, estante FROM producto")
    productos = cursor.fetchall()
    cursor.close()
    conn.close()
    return productos


def generar_embedding(texto: str) -> list[float]:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("Falta la variable de entorno OPENROUTER_API_KEY")

    resp = requests.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={"model": EMBEDDING_MODEL, "input": texto, "dimensions": VECTOR_SIZE},
    )
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]


def crear_coleccion():
    resp = requests.put(
        f"{QDRANT_URL}/collections/{COLLECTION}",
        json={"vectors": {"size": VECTOR_SIZE, "distance": "Cosine"}},
    )
    print("Crear colección:", resp.status_code, resp.json())


def sincronizar():
    productos = obtener_productos_mysql()
    print(f"{len(productos)} productos encontrados en MySQL.\n")

    points = []
    for p in productos:
        # Usamos 'usos' como texto principal para el embedding, que es
        # justo el campo pensado para comparación semántica.
        texto = f"{p['nombre']}. Usos: {p['usos']}. {p['descripcion']}"
        print(f"Generando embedding: {p['nombre']} (id={p['id']})")
        vector = generar_embedding(texto)

        points.append({
            "id": p["id"],  # MISMO id que en MySQL, para poder cruzarlos después
            "vector": vector,
            "payload": {
                "nombre": p["nombre"],
                "usos": p["usos"],
            },
        })

    resp = requests.put(
        f"{QDRANT_URL}/collections/{COLLECTION}/points",
        json={"points": points},
    )
    print("\nInsertar en Qdrant:", resp.status_code, resp.json())


def probar_busqueda(consulta: str):
    print(f"\nProbando búsqueda con: '{consulta}'")
    vector = generar_embedding(consulta)
    resp = requests.post(
        f"{QDRANT_URL}/collections/{COLLECTION}/points/search",
        json={"vector": vector, "limit": 3, "with_payload": True},
    )
    for r in resp.json().get("result", []):
        print(f"  - id={r['id']} {r['payload']['nombre']} (score: {r['score']:.4f})")


if __name__ == "__main__":
    crear_coleccion()
    sincronizar()
    probar_busqueda("me arde el estómago")