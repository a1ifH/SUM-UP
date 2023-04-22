import { Col, Modal, Row } from "antd";
import React from "react";
const AudioDetailModal = ({ open, onHide, record }) => {
  return (
    <>
      <Modal
        title="Detail"
        width={1000}
        open={open}
        onOk={onHide}
        onCancel={onHide}
      >
        <Row gutter={[16, 24]}>
          <Col md={24}>
            <table className="detailTable">
              <tr>
                <th>Generated Text</th>
                <th>Summarized Text</th>
              </tr>
              <tr>
                <td>
                  <p>{record.generatedText}</p>
                </td>
                <td>
                  <p>{record.summarizedText}</p>
                </td>
              </tr>
            </table>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default AudioDetailModal;
