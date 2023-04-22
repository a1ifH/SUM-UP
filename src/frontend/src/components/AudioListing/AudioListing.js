import React from "react";
import styles from "./AudioListing.module.css";
import AudioTable from "./AudioTable";
import NavBar from "../NavBar/NavBar";
import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom";
const AudioListing = () => {
  const navigate = useNavigate();
  return (
    <>
      <NavBar />

      <div className={styles.container}>
        <div className={styles.headSection}>
          <div>
            <img src={process.env.PUBLIC_URL + `/logo.png`} alt="Logo" />
          </div>
          <div>
            <h1 className="text-white">Quickey</h1>
          </div>
          <div></div>
        </div>
        <div className={styles.innerBox}>
          <Card
            className={styles.cardStyle}
            title="History"
            extra={
              <Button onClick={() => navigate("/dashboard")} type="primary">
                Back
              </Button>
            }
            bordered={false}
          >
            <AudioTable />
          </Card>
        </div>
      </div>
    </>
  );
};

export default AudioListing;
