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

import random
import requests

QDRANT_URL = "http://localhost:6333"
COLLECTION = "drogueria_catalogo"
VECTOR_SIZE = 1536  # debe coincidir con el tamaño real de tu modelo de embeddings

PRODUCTOS = [
    {
        "id": 1,
        "nombre": "Acetaminofén 500mg",
        "indicaciones": "Alivio del dolor de cabeza leve y fiebre",
        "categoria": "Analgésico",
        "dosis_recomendada": "1 tableta cada 8 horas",
    },
    {
        "id": 2,
        "nombre": "Loratadina 10mg",
        "indicaciones": "Alivio de alergias, rinitis y estornudos",
        "categoria": "Antihistamínico",
        "dosis_recomendada": "1 tableta al día",
    },
    {
        "id": 3,
        "nombre": "Ibuprofeno 400mg",
        "indicaciones": "Dolor muscular, dolor de cabeza, inflamación leve",
        "categoria": "Antiinflamatorio",
        "dosis_recomendada": "1 tableta cada 8 horas con alimentos",
    },
    {
        "id": 4,
        "nombre": "Sales de rehidratación oral",
        "indicaciones": "Diarrea leve, deshidratación por vómito",
        "categoria": "Rehidratante",
        "dosis_recomendada": "1 sobre disuelto en 1 litro de agua",
    },
]


def vector_aleatorio(size: int = VECTOR_SIZE) -> list[float]:
    """Genera un vector aleatorio normalizado, solo para pruebas mecánicas."""
    vec = [random.uniform(-1, 1) for _ in range(size)]
    norma = sum(v * v for v in vec) ** 0.5
    return [v / norma for v in vec]


def crear_coleccion():
    resp = requests.put(
        f"{QDRANT_URL}/collections/{COLLECTION}",
        json={"vectors": {"size": VECTOR_SIZE, "distance": "Cosine"}},
    )
    print("Crear colección:", resp.status_code, resp.json())


def insertar_productos():
    points = []
    for p in PRODUCTOS:
        points.append({
            "id": p["id"],
            "vector": vector_aleatorio(),
            "payload": {
                "nombre": p["nombre"],
                "indicaciones": p["indicaciones"],
                "categoria": p["categoria"],
                "dosis_recomendada": p["dosis_recomendada"],
            },
        })

    resp = requests.put(
        f"{QDRANT_URL}/collections/{COLLECTION}/points",
        json={"points": points},
    )
    print("Insertar productos:", resp.status_code, resp.json())


def verificar():
    resp = requests.get(f"{QDRANT_URL}/collections/{COLLECTION}")
    print("Info de la colección:", resp.json())


if __name__ == "__main__":
    crear_coleccion()
    insertar_productos()
    verificar()
    print(f"\nListo. Se insertaron {len(PRODUCTOS)} productos en '{COLLECTION}'.")
