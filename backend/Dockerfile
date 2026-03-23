FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Ensure persistent directories exist at build time
# (Render disk mounts will take priority at runtime)
RUN mkdir -p /app/instance /app/uploads/fabric /app/uploads/measurement

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--timeout", "120", "app:app"]
