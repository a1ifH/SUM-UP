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
          //   console.log(record);
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
        // Get the currently logged in user
        // Get a reference to the subcollection that contains the user's data
        const audioToTextCollectionRef = collection(db, "audioToText");
        const audioToTextDataRef = doc(audioToTextCollectionRef, uid);
        const audioToTextSubCollectionRef = collection(
          audioToTextDataRef,
          "records"
        );

        // Query the subcollection to get all documents that belong to the user
        const audioToTextQuery = query(
          audioToTextSubCollectionRef,
          where("uid", "==", uid)
        );
        const audioToTextDocs = await getDocs(audioToTextQuery);

        // Log the data for each document to the console

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
  const onHide = () => {
    setOpen(false);
  };
  const columns = [
    {
      title: "User Id",
      dataIndex: "uid",
      //   key: "uid",
    },
    {
      title: "User Email",
      dataIndex: "email",
      //   key: "email",
    },
    {
      title: "Generated Text",
      dataIndex: "generatedText",
      render: (_, record) => {
        return <>{record.generatedText.slice(0, 50)} ...</>;
      },
    },
    {
      title: "Summarize Text",
      dataIndex: "summarizedText",
      render: (_, record) => {
        return <>{record.summarizedText.slice(0, 50)} ...</>;
      },
    },
    {
      title: "Action",
      // dataIndex: "address",
      // key: "address",
      render: (_, record) => {
        return (
          <>
            <Dropdown
              menu={{
                items,
                onClick: () => {
                  setRecord(record);
                  setOpen(true);
                },
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-three-dots-vertical"
                viewBox="0 0 16 16"
              >
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
              </svg>
            </Dropdown>
          </>
        );
      },
    },
  ];
  return (
    <>
      {open && <AudioDetailModal open={open} onHide={onHide} record={record} />}
      <Spin spinning={loading}>
        <Table
          style={{ overflowX: "scroll" }}
          dataSource={audioRecord}
          columns={columns}
        />
      </Spin>
    </>
  );
};

export default AudioTable;
