import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
function NavBar(props) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(
          "🚀 ~ file: NavBar.js:11 ~ auth.onAuthStateChanged ~ user:",
          user
        );
        const { displayName } = user;
        setUser({ displayName });
      } else setUser(false);
    });
  }, []);

  const signOutUser = () => {
    signOut(auth)
      .then(() => {
        window.location.href = "/";
      })
      .catch((error) => {
      });
  };

  const showMyData = () => {
    navigate("/history");
  };

  return (
    <>
      <div className="nav-sidebar">
        <a className="profile-item" href="">
          <i className="fa fa-user"></i>
          <p>{user?.displayName}</p>
        </a>
        <a href="#" className="middle-nav-item" onClick={showMyData}>
          History
        </a>
        <a href="" onClick={signOutUser}>
          Sign Out
        </a>
      </div>
    </>
  );
}

export default NavBar;
