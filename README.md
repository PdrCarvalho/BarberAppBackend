# BarberAppBackend

docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -v /home/postgres/data:/var/lib/postgresql/data -d postgres

docker run -p  27017:27017 -v /home/carvalho/data:/data/db -d mongo