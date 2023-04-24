import React, { useContext, useEffect, useState } from "react";
import styles from "./Audio.module.css";
import { Button, Spin, notification } from "antd";
import { BASE_URL } from "./../../constants";

import { addDoc, collection, doc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { AppContext } from "../../App";
import TextArea from "antd/es/input/TextArea";

function AudioToTextConverter() {
  const {
    file,
    setFile,
    generatedText,
    setGeneratedText,
    summarizedText,
    setSummarizedText,
    loader,
    setLoader,
  } = useContext(AppContext);

  const currentUser = auth.currentUser;

  const { uid, email } = currentUser;

  const handleInputFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleGeneratedTextAreaChange = (value) => {
    setGeneratedText(value);
  };

  const handleSummarizedTextAreaChange = (value) => {
    setSummarizedText(value);
  };

  const saveDataToFireBase = async () => {
    if (
      [null, "", undefined].includes(generatedText) ||
      [null, "", undefined].includes(summarizedText)
    ) {
      notification.warning({ message: "Please fill the text field" });
      return;
    }
    setLoader(true);
    notification.success({ message: "Saving data to the firebase" });
    try {
      const audioToTextCollectionRef = collection(db, "audioToText");
      const audioToTextDataRef = doc(audioToTextCollectionRef, uid);
      const audioToTextSubCollectionRef = collection(
        audioToTextDataRef,
        "records"
      );
      const data = {
        uid,
        email,
        generatedText,
        summarizedText,
      };

      await addDoc(audioToTextSubCollectionRef, data);
      setFile("");
      setGeneratedText("");
      setSummarizedText("");
      notification.success({ message: "Saved Successfully!" });

      setLoader(false);
    } catch (e) {
      setLoader(false);
      console.error("Error adding document:", e);
    }
  };

  let backgroundStatus = (id) => {
    if (localStorage.getItem("audioToTextConverter") != "null") {
      fetch(`${BASE_URL}/task/${id}`, {
        method: "GET",
      })
        .then((res) => res.json())
        .then((data) => {
          const { id, status, result } = data;
          if (id === null) {
            setTimeout(() => {
              if (typeof backgroundStatus == "function") {
                backgroundStatus(
                  JSON.parse(localStorage.getItem("audioToTextConverter"))?.id
                );
              }
            }, 5000);
          } else if (["PENDING", "PROGRESS"].includes(status) && status) {
            try {
              if (status == "PROGRESS") {
                setGeneratedText(result?.text);
              }
              setTimeout(() => {
                if (typeof backgroundStatus == "function") {
                  backgroundStatus(id);
                }
              }, 5000);
            } catch (error) {
              localStorage.setItem("audioToTextConverter", "null");
            }
          } else if (status == "SUCCESS") {
            setGeneratedText(result);
            setLoader(false);
            localStorage.setItem("audioToTextConverter", "null");
          } else if (status == "FAILURE") {
            setLoader(false);
            localStorage.setItem("audioToTextConverter", "null");
            notification.error({ message: status });
          }
        })
        .catch((err) => {
          localStorage.setItem("audioToTextConverter", "null");
          setLoader(false);
        });
    }
  };
  const HandleGenerateText = () => {
    if ([null, "", undefined].includes(file)) {
      notification.warning({ message: "Please select your audio file" });
      return;
    }
    if (!["audio/wav"].includes(file["type"])) {
      notification.warning({ message: "File must be with .wav extension" });
      return;
    }

    setLoader(true);
    let formData = new FormData();
    formData.append("file", file);
    fetch(`${BASE_URL}/convert`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        const { id, status, result } = data;
        localStorage.setItem(
          "audioToTextConverter",
          JSON.stringify({ id, status, result })
        );
        try {
          setTimeout(() => {
            if (typeof backgroundStatus == "function") {
              backgroundStatus(id);
            }
          }, 5000);
        } catch (error) {
          localStorage.setItem("audioToTextConverter", "null");
        }
      })
      .catch((err) => {
        try {
          setLoader(false);
          err.response.data.errors.map((error) =>
            notification.error({ message: error })
          );
        } catch (error) {
          notification.error({ message: "Please contact to the support team" });
        }
      });
  };

  const handleSummarizeSubmit = async () => {
    if ([null, "", undefined].includes(generatedText)) {
      notification.warning({ message: "Please fill the text field" });
      return;
    }

    setLoader(true);
    await fetch(`${BASE_URL}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: generatedText,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        const { message, text } = data;
        setSummarizedText(text);
        notification.success({ message });
        setLoader(false);
      })
      .catch((err) => {
        try {
          setLoader(false);
          err.response.data.errors.map((error) =>
            notification.error({ message: error })
          );
        } catch (error) {
          notification.error({ message: "Please contact to the support team" });
        }
      });
  };

  useEffect(() => {
    if (
      localStorage.getItem("audioToTextConverter") &&
      localStorage.getItem("audioToTextConverter") != "null"
    ) {
      setLoader(true);
      backgroundStatus(
        JSON.parse(localStorage.getItem("audioToTextConverter"))?.id
      );
    }
    return () => {
      backgroundStatus = null;
    };
  }, [localStorage.getItem("audioToTextConverter") != "null"]);

  useEffect(() => {
    if (localStorage.getItem("audioToTextConverter") == undefined) {
      localStorage.setItem("audioToTextConverter", "null");
    }
  }, []);
  const handleDownloadAsTextFile = () => {
    if (!summarizedText) {
      notification.error({ message: "Summarized text can't be empty" });
      return;
    }
    setLoader(true);
    fetch(`${BASE_URL}/doc/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: summarizedText,
      }),
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.doc";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          setLoader(false);
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 0);
      })
      .catch((err) => {
        try {
          err.response.data.errors.map((error) =>
            notification.error({ message: error })
          );
        } catch (error) {
          notification.error({ message: "Please contact to the support team" });
        }
        setLoader(false);
      });
  };
  const handleConvertAsAudioFile = () => {
    if (!summarizedText) {
      notification.error({ message: "Summarized text can't be empty" });
      return;
    }
    setLoader(true);
    fetch(`${BASE_URL}/audio/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: summarizedText,
      }),
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const audioPlayer = document.getElementById("audio-player");
        const audioURL = URL.createObjectURL(blob);
        audioPlayer.querySelector("source").src = audioURL;
        audioPlayer.load();

        setTimeout(() => {
          setLoader(false);
          window.URL.revokeObjectURL(url);
        }, 0);
      })
      .catch((err) => {
        try {
          err.response.data.errors.map((error) =>
            notification.error({ message: error })
          );
        } catch (error) {
          notification.error({ message: "Please contact to the support team" });
        }
        setLoader(false);
      });
  };
  return (
    <div className={styles.container}>
      <div className={styles.headSection}>
        <div>
          <img src={process.env.PUBLIC_URL + `/logo.png`} alt="Logo" />
        </div>
        <div>
          <h1 className="text-white">SUM-UP</h1>
        </div>
        <div></div>
      </div>
      <Spin spinning={loader}>
        <div className={styles.innerBox + " container-fluid"}>
          <input
            type="file"
            accept="audio/*"
            className="form-control"
            onChange={handleInputFile}
          />
          <Button onClick={HandleGenerateText}>Generate text</Button>
          <div className="row">
            <div className={"col-lg-6 col-md-6 col-sm-6"}>
              <label>Initial Text:</label>
              <TextArea
                rows={4}
                cols={80}
                value={generatedText}
                onChange={({ target: { value } }) =>
                  handleGeneratedTextAreaChange(value)
                }
              />
              <Button className="w-100 mt-3" onClick={handleSummarizeSubmit}>
                Summarize text
              </Button>
            </div>
            <div className={"col-lg-6 col-md-6 col-sm-6 mt-0"}>
              <label className="mt-xs-4">Summarized Text:</label>
              <TextArea
                cols={80}
                rows={4}
                value={summarizedText}
                onChange={({ target: { value } }) =>
                  handleSummarizedTextAreaChange(value)
                }
              />
              <div className="col-12">
                <audio controls className="w-100 mt-1" id="audio-player">
                  <source type="audio/wav" />
                </audio>
              </div>
              <Button
                className="col-lg-6 col-md-12 col-sm-12 mt-3 downloadButton"
                onClick={handleDownloadAsTextFile}
              >
                Download as text file
              </Button>
              <Button
                className="col-lg-6 col-md-12 col-sm-12 mt-3 downloadButton"
                onClick={handleConvertAsAudioFile}
              >
                Convert to audio file
              </Button>
            </div>
          </div>

          <div className={styles.footer}>
            <button onClick={saveDataToFireBase}>Save</button>
          </div>
        </div>
      </Spin>
    </div>
  );
}

export default AudioToTextConverter;
