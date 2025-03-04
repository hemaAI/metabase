import cx from "classnames";
import { t } from "ttag";

import Modal from "metabase/components/Modal";
import ModalContent from "metabase/components/ModalContent";
import ButtonsS from "metabase/css/components/buttons.module.css";
import type Question from "metabase-lib/v1/Question";

interface Props {
  isShowingNewbModal: boolean;
  question: Question;
  onClose: () => void;
}

const getLabels = (question: Question) => {
  const type = question.type();

  if (type === "question") {
    return {
      title: t`It's okay to play around with saved questions`,
      message: t`You won't make any permanent changes to a saved question unless you click Save and choose to replace the original question.`,
    };
  }

  if (type === "model") {
    return {
      title: t`It's okay to play around with models`,
      message: t`You won't make any permanent changes to them unless you edit their query definition.`,
    };
  }
  throw new Error(`Unknown question.type(): ${type}`);
};

export const SavedQuestionIntroModal = ({
  question,
  isShowingNewbModal,
  onClose,
}: Props) => {
  const { title, message } = getLabels(question);

  return (
    <Modal isOpen={isShowingNewbModal}>
      <ModalContent title={title} className="Modal-content text-centered py2">
        <div className="px2 pb2 text-paragraph">{message}</div>
        <div className="Form-actions flex justify-center py1">
          <button
            className={cx(ButtonsS.Button, ButtonsS.ButtonPrimary)}
            onClick={onClose}
          >
            {t`Okay`}
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
};
