docker run --rm -it \
    --name ferris \
    -v $(pwd)/src:/app \
    -v $(pwd)/src/store:/app/store \
    -v $(pwd)/src/config:/app/config \
    -p 60001:60001 \
    rekey/ferris