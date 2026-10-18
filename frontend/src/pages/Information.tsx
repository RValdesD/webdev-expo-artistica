import { Link } from "react-router-dom";

interface Exhibition {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  discipline: string;
  dates: string;
  room: string;
  description: string;
}

const otherExhibitions: Exhibition[] = [
  {
    id: "luz-de-acuarela",
    title: "Luz de acuarela",
    artistId: "demo-elena-rios",
    artistName: "Elena Ríos",
    discipline: "Pintura",
    dates: "12 jun – 31 jul 2027",
    room: "Sala A",
    description: "Paisajes costeros pintados en capas transparentes, donde el agua y la luz se mezclan.",
  },
  {
    id: "formas-en-equilibrio",
    title: "Formas en equilibrio",
    artistId: "demo-tomas-vidal",
    artistName: "Tomás Vidal",
    discipline: "Escultura",
    dates: "13 jun – 15 ago 2027",
    room: "Sala B",
    description: "Esculturas de papel y arcilla que juegan con el peso, el vacío y el movimiento.",
  },
  {
    id: "mirar-el-puerto",
    title: "Mirar el puerto",
    artistId: "demo-ines-soto",
    artistName: "Inés Soto",
    discipline: "Fotografía",
    dates: "19 jun – 31 ago 2027",
    room: "Sala C",
    description: "Una serie fotográfica sobre los muelles, los pescadores y los reflejos del atardecer.",
  },
  {
    id: "cuadernos-de-viaje",
    title: "Cuadernos de viaje",
    artistId: "demo-lucia-mora",
    artistName: "Lucía Mora",
    discipline: "Pintura e ilustración",
    dates: "20 jun – 30 sep 2027",
    room: "Sala D",
    description: "Dibujos y apuntes de color hechos en recorridos por la costa, expuestos página a página.",
  },
];

export default function Information() {
  return (
    <>
      <section className="hero" aria-labelledby="expo-title">
        <div className="hero-copy">
          <p className="texti">Exposicion: Los Grandes Mares</p>
          <h1 id="expo-title">
            Un viaje in<em>agua</em>lable
          </h1>
          <p className="intro"></p>
          <p></p>
          <p>
            A fish swam past the pond with a bit of bread. <br></br>
            Another fish bonked his head. <br></br>
            When they saw the fisherman, they looked shocked and swam away. <br></br>
            This was another normal day.<br></br>
            <br></br>
            Hastily I threw a bait. <br></br>
            The fishes then gobbled and ate. <br></br>
            I reeled it up, eating was my wish. <br></br>
            <em>The fish was delish and it made quite a dish. </em> <br></br>

          </p>
          <br>
          </br>          
          <Link className="button" to="/visitas">
            <span>Visitas</span>
          </Link>
        </div>

        <figure className="hero-figure">
          <img
            className="hero-image"
            src="/images/FISH.png"
            alt="Describe the painting here"
          />
          <figcaption>Fish</figcaption>
        </figure>
      </section>

      <section className="exhibitions" aria-labelledby="exhibitions-title">
        <header className="exhibitions__heading">
          <p className="eyebrow">TAMBIÉN EN LA EXPO</p>
          <h2 id="exhibitions-title">Otras exposiciones</h2>
          <p>Recorre las salas y conoce a los artistas detrás de cada muestra.</p>
        </header>

        <ul className="exhibitions__grid">
          {otherExhibitions.map(exhibition => (
            <li key={exhibition.id} className="exhibition-card">
              <p className="exhibition-card__meta">{exhibition.room} · {exhibition.discipline}</p>
              <h3>{exhibition.title}</h3>
              <p className="exhibition-card__dates">{exhibition.dates}</p>
              <p>{exhibition.description}</p>
              <Link className="exhibition-card__link" to={`/artists/${exhibition.artistId}`}>
                Conoce a {exhibition.artistName} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link className="button" to="/workshops">
          <span>Ver talleres e inscribirse</span>
        </Link>
      </section>
    </>
  );
}
