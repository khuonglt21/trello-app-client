import axios from 'axios';
import {openAlert} from '../redux/Slices/alertSlice';

import {
    reset,
    setPending,
    updateTitle,
    setCard,
    updateLabel,
    updateLabelSelection, createLabel, updateCreatedLabelId,
} from '../redux/Slices/cardSlice';
import {
    createLabelBoard,

    updateBoardLabel, updateCreatedLabelIdBoard
} from '../redux/Slices/boardSlice';

import {
    createLabelForCard,
    setCardTitle,
    updateLabelOfCard,
    updateLabelSelectionOfCard

} from '../redux/Slices/listSlice';


const baseUrl = process.env.REACT_APP_API_ENDPOINT + '/card';
let submitCall = Promise.resolve();

export const getCard = async (cardId, listId, boardId, dispatch, boardLabels) => {
    dispatch(setPending(true));
    try {
        // let response = '';
        // submitCall = submitCall.then(() =>
        //     axios.get(baseUrl + '/' + boardId + '/' + listId + '/' + cardId).then((res) => {
        //         response = res;
        //     })
        // );
        // await submitCall;

        const response = await axios.get(baseUrl + '/' + boardId + '/' + listId + '/' + cardId);
        const card = await JSON.parse(JSON.stringify(response.data));
        // b1 lay label cua card
        // b2 so sanh labl card voi lbael board
        // neu chua co , thi push
        // neu da co, lay ten cua label board gan vao ten cua label card

        for (let i = 0; i < boardLabels.length; i++) {
            let flag= false;
            for (let j = 0; j < card.labels.length; j++) {
                if(card.labels[j]._id.toString() === boardLabels[i]._id.toString()) {
                    card.labels[j].text = boardLabels[i].text;
                    card.labels[j].color = boardLabels[i].color;
                    flag = true;
                    break;
                }
            }
            if(flag === false){
                card.labels.push(boardLabels[i]);
            }
        }
        await axios.put(baseUrl + '/' + boardId + '/' + listId + '/' + cardId, {labels: card.labels});
        dispatch(setCard(card));
        dispatch(setPending(false));
    } catch (error) {
        dispatch(setPending(false));
        dispatch(
            openAlert({
                message: error?.response?.data?.errMessage ? error.response.data.errMessage : error.message,
                severity: 'error',
            })
        );
    }
};

export const titleUpdate = async (cardId, listId, boardId, title, dispatch) => {
    try {
        dispatch(setCardTitle({listId, cardId, title}));
        dispatch(updateTitle(title));


        await axios.put(baseUrl + '/' + boardId + '/' + listId + '/' + cardId, {title: title})

    } catch (error) {
        dispatch(
            openAlert({
                message: error?.response?.data?.errMessage ? error.response.data.errMessage : error.message,
                severity: 'error',
            })
        );
    }
};

export const labelUpdate = async (cardId, listId, boardId, labelId, label, dispatch) => {
    try {
        dispatch(updateLabel({ labelId: labelId, text: label.text, color: label.color, backColor: label.backColor }));

        dispatch(updateBoardLabel({ labelId: labelId, text: label.text, color: label.color, backColor: label.backColor }));
        dispatch(
            updateLabelOfCard({
                listId,
                cardId,
                labelId: labelId,
                text: label.text,
                color: label.color,
                backColor: label.backColor,
            })
        );

        submitCall = submitCall.then(() =>
            axios.put(baseUrl + '/' + boardId + '/' + listId + '/' + cardId + '/' + labelId + '/update-label', label)
        );
        await submitCall;
    } catch (error) {
        dispatch(
            openAlert({
                message: error?.response?.data?.errMessage ? error.response.data.errMessage : error.message,
                severity: 'error',
            })
        );
    }
};

export const labelUpdateSelection = async (cardId, listId, boardId, labelId, selected, dispatch) => {
    try {
        dispatch(updateLabelSelection({ labelId: labelId, selected: selected }));
        dispatch(updateLabelSelectionOfCard({ listId, cardId, labelId, selected }));
        submitCall = submitCall.then(() =>
            axios.put(
                baseUrl + '/' + boardId + '/' + listId + '/' + cardId + '/' + labelId + '/update-label-selection',
                { selected: selected }
            )
        );
        await submitCall;
    } catch (error) {
        dispatch(
            openAlert({
                message: error?.response?.data?.errMessage ? error.response.data.errMessage : error.message,
                severity: 'error',
            })
        );
    }
};

export const labelCreate = async (cardId, listId, boardId, text, color, backColor, dispatch) => {
    try {
        dispatch(createLabel({ _id: 'notUpdated', text, color, backColor, selected: true }));
        dispatch(createLabelBoard({ _id: 'notUpdated', text, color, backColor, selected: false }));

        let response = '';
        submitCall = submitCall.then(() =>
            axios
                .post(baseUrl + '/' + boardId + '/' + listId + '/' + cardId + '/create-label', {
                    text,
                    color,
                    backColor,
                })
                .then((res) => {
                    response = res;
                })
        );
        await submitCall;

        dispatch(updateCreatedLabelId(response.data.labelId));
        dispatch(updateCreatedLabelIdBoard(response.data.labelId));
        dispatch(
            createLabelForCard({ listId, cardId, _id: response.data.labelId, text, color, backColor, selected: true })
        );

    } catch (error) {
        dispatch(
            openAlert({
                message: error?.response?.data?.errMessage ? error.response.data.errMessage : error.message,
                severity: 'error',
            })
        );
    }
};

