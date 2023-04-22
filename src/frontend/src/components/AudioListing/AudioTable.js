import { Dropdown, Spin, Table, notification } from "antd";
import React, { useState, useEffect } from "react";

import AudioDetailModal from "./AudioDetailModal";
import { auth, db } from "../../firebase";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const items = [
  {
    key: "1",
    label: (
      <div
        onClick={() => {
        }}
      >
        View Details
      </div>
    ),
  },
];

const AudioTable = () => {
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState({});
  const [audioRecord, setAudioRecord] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;
  useEffect(() => {
    getAudioToTextListing();
  }, [uid]);
  const getAudioToTextListing = async () => {
    if (!uid) {
      navigate("/dashboard");
      return;
    } else {
      try {
        setLoading(true);
        const audioToTextCollectionRef = collection(db, "audioToText");
        const audioToTextDataRef = doc(audioToTextCollectionRef, uid);
        const audioToTextSubCollectionRef = collection(
          audioToTextDataRef,
          "records"
        );

        const audioToTextQuery = query(
          audioToTextSubCollectionRef,
          where("uid", "==", uid)
        );
        const audioToTextDocs = await getDocs(audioToTextQuery);

        audioToTextDocs.forEach((doc) => {
          setAudioRecord((audioRecord) => [...audioRecord, { ...doc.data() }]);
        });

        setLoading(false);
      } catch (err) {
        try {
          console.log(
            "🚀 ~ file: AudioTable.js:60 ~ getAudioToTextListing ~ err:",
            err
          );
          setLoading(false);
          notification.error({ message: err });
        } catch (err) {
          notification.error({ message: "Please contact to the support team" });
        }
      }
    }
  };
