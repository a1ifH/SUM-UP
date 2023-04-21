import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";

import AudioToTextConverter from "../Audio/Audio";
import NavBar from "../NavBar/NavBar";

function Home(props) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        const { uid, email } = user;
        setUser({ email, uid });
      } else setUser(false);
    });
  }, []);

  return (
    <div>
      {user && (
        <>
          <NavBar />
          <AudioToTextConverter />
        </>
      )}
    </div>
  );
}

export default Home;
