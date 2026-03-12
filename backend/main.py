from fastapi import FastAPI, File, UploadFile, Form
from sklearn.preprocessing import MinMaxScaler, StandardScaler, RobustScaler
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import io

from fastapi.responses import StreamingResponse

app=FastAPI()

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"status": "API is running"}

# To preprocess data and output a cleaned CSV
@app.post("/preprocess")
async def upload_file(file: UploadFile=File(...), strategy: str=Form(...), encoding: str=Form(...),
                      scaling: str=Form(...)):
    contents=await file.read()
    df=pd.read_csv(io.BytesIO(contents))
    
    missing_before=df.isnull().sum().sum()

    numerical_cols= df.select_dtypes(include=["int64","float64"]).columns.tolist()
    categorical_cols= df.select_dtypes(include=["object"]).columns.tolist()

#Numerical Encoding 
    if strategy=="drop":
        df=df.dropna()
    elif strategy=="mean":
        for col in numerical_cols:
            df[col]=df[col].fillna(df[col].mean())
    elif strategy=="median":
        for col in numerical_cols:
            df[col]=df[col].fillna(df[col].median())
    elif strategy=="mode":
        for col in numerical_cols + categorical_cols:
            df[col]=df[col].fillna(df[col].mode()[0])

    
# Categorical encoding
    le=LabelEncoder()
    if encoding=="label":
        for col in categorical_cols:
            df[col]=le.fit_transform(df[col])
    elif encoding=="one-hot":
        df=pd.get_dummies(df,columns=categorical_cols)

    
#Scaling
    if scaling=="minmax":
        scaler=MinMaxScaler()
        df[numerical_cols]=scaler.fit_transform(df[numerical_cols])
    elif scaling=="standard":
        scaler=StandardScaler()
        df[numerical_cols]=scaler.fit_transform(df[numerical_cols])
    elif scaling=="robust":
        scaler=RobustScaler()
        df[numerical_cols]=scaler.fit_transform(df[numerical_cols])
    # OR
    # scalers = {
    #     "minmax": MinMaxScaler(),
    #     "standard": StandardScaler(),
    #     "robust": RobustScaler()
    #     }

    # if scaling in scalers:
    #     df[numerical_cols] = scalers[scaling].fit_transform(df[numerical_cols])



#Boolean Encoding
    bool_cols = df.select_dtypes(include=["bool"]).columns.tolist()
    for col in bool_cols:
        df[col] = df[col].astype(int)


# Reurn Output CSV file
    output=io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition":"attachment; filename=cleaned.csv"}
    )

# =================================================================================================================================================
# =================================================================================================================================================


# Report on what changes were made to the input CSV file 
@app.post("/report")
async def upload_file(file: UploadFile=File(...), strategy: str=Form(...), encoding: str=Form(...),
                      scaling: str=Form(...)):
    contents=await file.read()
    df=pd.read_csv(io.BytesIO(contents))
    
    original_shape=df.shape
    missing_before=df.isnull().sum().sum()

    numerical_cols= df.select_dtypes(include=["int64","float64"]).columns.tolist()
    categorical_cols= df.select_dtypes(include=["object"]).columns.tolist()

#Numerical Encoding 
    if strategy=="drop":
        df=df.dropna()
    elif strategy=="mean":
        for col in numerical_cols:
            df[col]=df[col].fillna(df[col].mean())
    elif strategy=="median":
        for col in numerical_cols:
            df[col]=df[col].fillna(df[col].median())
    elif strategy=="mode":
        for col in numerical_cols + categorical_cols:
            df[col]=df[col].fillna(df[col].mode()[0])

    
# Categorical encoding
    le=LabelEncoder()
    if encoding=="label":
        for col in categorical_cols:
            df[col]=le.fit_transform(df[col])
    elif encoding=="one-hot":
        df=pd.get_dummies(df,columns=categorical_cols)

    
#Scaling
    if scaling=="minmax":
        scaler=MinMaxScaler()
        df[numerical_cols]=scaler.fit_transform(df[numerical_cols])
    elif scaling=="standard":
        scaler=StandardScaler()
        df[numerical_cols]=scaler.fit_transform(df[numerical_cols])
    elif scaling=="robust":
        scaler=RobustScaler()
        df[numerical_cols]=scaler.fit_transform(df[numerical_cols])
    # OR
    # scalers = {
    #     "minmax": MinMaxScaler(),
    #     "standard": StandardScaler(),
    #     "robust": RobustScaler()
    #     }

    # if scaling in scalers:
    #     df[numerical_cols] = scalers[scaling].fit_transform(df[numerical_cols])



#Boolean Encoding
    bool_cols = df.select_dtypes(include=["bool"]).columns.tolist()
    for col in bool_cols:
        df[col] = df[col].astype(int)



# Reurn Output CSV file
    output=io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return (
        {
            "original_shape": list(original_shape),
            "cleaned_shape": list(df.shape),
            "missing_filled": int(missing_before - df.isnull().sum().sum()),
            "columns_encoded": categorical_cols,
            "columns_scaled": numerical_cols,
            "strategy": strategy,
            "encoding": encoding,
            "scaling": scaling
}
    )
