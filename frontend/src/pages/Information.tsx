import { Link } from "react-router-dom";

export default function Information() {
  return (
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
  );
}
