"""
Script para cargar productos de prueba en Qdrant.

Uso:
    pip install requests
    python seed_qdrant.py

Esto:
1. Verifica que la colección 'drogueria_catalogo' exista (la crea si no).
2. Inserta varios productos de venta libre con vectores ALEATORIOS
   (solo para probar la mecánica de búsqueda, no la calidad semántica real).

Cuando tengan el EmbeddingService funcionando en el backend, reemplacen
la función `vector_aleatorio()` por una llamada real a OpenRouter/OpenAI
para generar embeddings verdaderos de cada producto.
"""

import requests
import os
import mysql.connector

MYSQL_CONFIG = {
    "host" : "localhost",
    "user" : "campus2023",
    "password" : os.environ.get("MYSQL_PASSWORD"),
    "database" : "drogeria",
}

QDRANT_URL = "http://localhost:6333"
COLLECTION = "drogueria_catalogo"
VECTOR_SIZE = 1536  

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
        raise RuntimeError(
            "Falta la variable de entorno OPENROUTER_API_KEY. "
            "Configúrala antes de correr el script."
        )
 
    resp = requests.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": EMBEDDING_MODEL,
            "input": texto,
            "dimensions": VECTOR_SIZE,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    return data["data"][0]["embedding"]

def crear_coleccion():
    resp = requests.put(
        f"{QDRANT_URL}/collections/{COLLECTION}",
        json={"vectors": {"size": VECTOR_SIZE, "distance": "Cosine"}},
    )
    print("Crear colección:", resp.status_code, resp.json())

def sincronizar():
    productos = obtener_productos_mysql()
    print(f"{len(productos)} productos encontrados en MYSQL. \n")

    points = []
    for p in productos:
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
    resultados = resp.json().get("result", [])
    for r in resultados:
        print(f"  - {r['payload']['nombre']} (score: {r['score']:.4f})")


if __name__ == "__main__":
    crear_coleccion()
    insertar_productos()
    print(f"\nListo. Se insertaron {len(PRODUCTOS)} productos con embeddings reales.")