Comandos para runnearlo de manera local:



desde art-expo 



TERMINAL 1

npm install

npm run seed

npm run server



TERMINAL 2

npm run dev


Esto conecta cuando mongoDB corre:

Win + R -> services.msc -> cambiar estado a Running



Para que aparezcan los elementos


npm exec --workspace backend -- tsx src/seedWorkshops.ts

npm exec --workspace backend -- tsx src/seedArtworks.ts

npm exec --workspace backend -- tsx src/seedArtists.ts



