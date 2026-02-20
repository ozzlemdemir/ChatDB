from llama_cpp import Llama
import os

# model dosyasının yolu
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "sqlcoder-7b-q5_k_m-001.gguf")


llm = None

def load_model():
    global llm
    print("Model yükleniyor...")
    llm = Llama(
        model_path=MODEL_PATH,
        n_ctx=2048,      
        n_threads=4,    
        verbose=False
    )
    print("Model hazır!")


def generate_sql(schema, question):
    prompt = f"""### Task:
Generate a SQL query to answer the following question.

### Database Schema:
{schema}

### Question:
{question}

### Answer:
"""
    output = llm(
        prompt,
        max_tokens=150,
        stop=["###", "\n\n"],
        echo=False
    )

    sql = output["choices"][0]["text"].strip()
    return sql