download_from_gdrive () {
  FILEID=$1
  FILENAME=$2
  CONFIRM=$(wget --quiet --save-cookies /tmp/cookies.txt \
    --keep-session-cookies --no-check-certificate \
    "https://docs.google.com/uc?export=download&id=${FILEID}" -O- | \
    sed -rn 's/.*confirm=([0-9A-Za-z_]+).*/\1/p')

  wget --load-cookies /tmp/cookies.txt \
    "https://docs.google.com/uc?export=download&confirm=${CONFIRM}&id=${FILEID}" \
    -O ${FILENAME}
  rm -rf /tmp/cookies.txt
}

echo "📥 Downloading large files from Google Drive..."

download_from_gdrive "1N2HmwjOVoA0sUq1sTuZIPcG-nxODiKE2" "disease_model_model.json"
download_from_gdrive "15yRkNW0TiGHGokbk9JHwX-3JNj75rryC" "filtered_dataset_min15.csv"
download_from_gdrive "1IMtjR6xDuHF0OArsFYuKXqILoAjVWF1K" "symptomMap.csv"
echo "✅ Files downloaded. Starting server..."

gdown --id 1N2HmwjOVoA0sUq1sTuZIPcG-nxODiKE2 -O disease_model_model.json
gdown --id 15yRkNW0TiGHGokbk9JHwX-3JNj75rryC -O filtered_dataset_min15.csv

JS_SERVER_FILE="index.js"
node "$JS_SERVER_FILE" &
SERVER_PID=$!

kill "$SERVER_PID"