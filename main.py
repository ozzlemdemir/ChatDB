from fastapi import FastAPI
from pydantic import BaseModel
from query_service import run_query

app = FastAPI()

class QueryRequest(BaseModel):
    sql: str

@app.post("/run-sql")
def execute_sql(request: QueryRequest):
    if request.sql.strip().lower().startswith(("delete")):
        return {"error": " DELETE statements are not allowed."}
    elif request.sql.strip().lower().startswith(("insert", "update")):
        return {"info": " INSERT and UPDATE statements are not just for SQL CODE."}
    else:
        result = run_query(request.sql)
    return {
        "sql": request.sql,
        "result": result
    }
