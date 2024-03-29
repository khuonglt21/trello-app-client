import React, {useEffect, useMemo, useRef, useState} from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import {
    AddTitleCardContainer,
    CardContainer,
    CardWrapper,
    Container,
    FooterButton,
    Header,
    Span,
    TitleInput,
    TitlePlaceholder,
    TitleNewCardInput,
} from './styled';
import {ClickableIcon} from '../../../pages/BoardPage/CommonStyled';
import BottomButtonGroup from '../BottomButtonGroup/BottomButtonGroup';
// import Card from '../Card/Card';
import {useDispatch, useSelector} from 'react-redux';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import DeleteIcon from '@mui/icons-material/DeleteForeverOutlined';
import {DeleteList, listTitleUpdate} from '../../../services/boardService';
import {createCard} from '../../../services/listService';
import {Droppable, Draggable} from 'react-beautiful-dnd';
import {CircularProgress} from "@mui/material";
import Card from "../Card/Card";
import {isMemberOfBoard} from "../../../utils/checkMemberRoleOfBoard";
import io from "socket.io-client";
let socket;
const ENDPOINT = process.env.REACT_APP_SERVER_ENDPOINT;



const List = (props) => {
    const {userInfo}=useSelector(state=>state.user)
    const {members}=useSelector(state=>state.board)
    const isMember=isMemberOfBoard(userInfo._id,members)

    const dispatch = useDispatch();
    const [clickTitle, setClickTitle] = useState(false);
    const [clickFooter, setClickFooter] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [currentListTitle, setCurrentListTitle] = useState(props.info.title);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const ref = useRef();
    const [isAdding, setIsAdding] = useState(false);
    const { filter} = useSelector((state) => state.board);
    const isFilterMember = useMemo(() => !!Object.values(filter.members).filter(value => value).length , [filter]);
    const isFilterLabel = useMemo(() => Object.values(filter.labels).includes(true) , [filter]);
    // console.log(props.info)
    const board = useSelector((state) => state.board);
    // console.log(board, "board")
    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("join", {rooms: userInfo.boards}, (error) => {
            if (error) {
                alert(error);
            }
        });

    }, []);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFooterClick = async () => {
        setNewCardTitle('');
        setIsAdding(prev => !prev);
        await createCard(newCardTitle, props.info._id, props.info.owner, dispatch);
        setIsAdding(prev => !prev);
        ref && ref.current && ref.current.scrollIntoView({behavior: 'smooth'});
        socket.emit("sendNotify", {sender: userInfo._id, room: board.id,  message:
                {
                    user: userInfo.name,
                    userColor: userInfo.color,
                    action: "Create A Card",
                    list: props.info?.title,
                    card: newCardTitle,
                    board: board.title,
                    date: Date.now()
                }})
    };
    const handleFooterCloseClick = () => {
        setClickFooter(false);
        setNewCardTitle('');
    };

    const handleOnChangeTitle = (e) => {
        if(!isMember) return
            setCurrentListTitle(e.target.value);
    };
    const handleChangeTitle = async () => {
        if (props.info.title !== currentListTitle)
            await listTitleUpdate(props.info._id, props.info.owner, currentListTitle, dispatch);
    };

    const handleDeleteClick = () => {
        if(!isMember)return;
        DeleteList(props.info._id, props.info.owner, dispatch);
    };

    const handleClickOutside = (e) => {
        if (ref.current)
            if (!ref.current.contains(e.target)) {
                setClickFooter(false);
                setNewCardTitle('');
            }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    });

    useEffect(() => {
        if (clickFooter) {
            ref.current.scrollIntoView();
        }
    }, [clickFooter]);

    // console.log(!props.info.cards[2].labels.find(label => label.selected), "no lable")
    // console.log(filter.labels, "filter")
    console.log(props.info.cards
        .filter(card => props.searchString ? card.title.toLowerCase().includes(props.searchString.toLowerCase()) : true)
        .filter(card => isFilterLabel ? filter.labels.noLabels ? !card.labels.length : card.labels.filter(label => filter.labels[label._id]).length : true)
    )
    return (
        <>
            <Draggable draggableId={props.info._id} index={props.index}>
                {(provided, snapshot) => {
                    return (
                        <Container
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            isDragging={snapshot.isDragging}
                        >
                            <Header {...provided.dragHandleProps} isDragging={snapshot.isDragging}>
                                <TitlePlaceholder show={clickTitle} onClick={() => setClickTitle(true)}>
                                    {currentListTitle}
                                </TitlePlaceholder>

                                <TitleInput
                                    onBlur={() => {
                                        setClickTitle(false);
                                        handleChangeTitle();
                                    }}
                                    ref={(input) => input && input.focus()}
                                    show={clickTitle}
                                    value={currentListTitle}
                                    onChange={handleOnChangeTitle}
                                />


                                <ClickableIcon
                                    color='#656565'
                                    aria-controls='basic-menu'
                                    aria-haspopup='true'
                                    aria-expanded={open ? 'true' : undefined}
                                    onClick={handleClick}
                                >
                                    <MoreHorizIcon fontSize='0.1rem' onClick={() => {
                                    }}/>
                                </ClickableIcon>
                                <Menu
                                    id='basic-menu'
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                    MenuListProps={{
                                        'aria-labelledby': 'basic-button',
                                    }}
                                >
                                    <MenuItem onClick={handleDeleteClick}>
                                        <ListItemIcon>
                                            <DeleteIcon fontSize='small'/>
                                        </ListItemIcon>
                                        <ListItemText>Delete</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </Header>
                            <Droppable droppableId={props.info._id} direction='vertical'>
                                {(provided, snapshot) => {
                                    return (
                                        <CardContainer
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            isDraggingOver={snapshot.isDraggingOver}
                                        >
                                            <CardWrapper dock={clickFooter}>
                                                {props.info.cards
                                                    .filter(card => props.searchString ? card.title.toLowerCase().includes(props.searchString.toLowerCase()) : true)
                                                    .filter(card => isFilterMember ? filter.members.noMembers ? (!card.members.length || card.members.filter(member => filter.members[member.user]).length) : card.members.filter(member => filter.members[member.user]).length : true)
                                                    .filter(card => isFilterLabel ? filter.labels.noLabels ? (!card.labels.find(label => label.selected) || card.labels.filter(label => label.selected && filter.labels[label._id]).length) : card.labels.filter(label => label.selected && filter.labels[label._id]).length : true)
                                                    .map((card, index) => {
                                                    return (
                                                        <Card
                                                            boardId={props.boardId}
                                                            listId={props.info._id}
                                                            key={card._id}
                                                            index={index}
                                                            info={card}
                                                        />
                                                    );
                                                })}
                                                {provided.placeholder }
                                            {clickFooter && (
                                                    <AddTitleCardContainer ref={ref}>
                                                        <TitleNewCardInput
                                                            value={newCardTitle}
                                                            disabled={isAdding}
                                                            autoFocus={true}
                                                            placeholder='Enter a title for this card...'
                                                            height={Math.floor(newCardTitle.length / 16) + 'rem'}
                                                            onChange={(e) => setNewCardTitle(e.target.value)}
                                                        />
                                                        {isAdding ? <CircularProgress size="1.5rem"/> :
                                                            <BottomButtonGroup
                                                                title={'Add card'}
                                                                clickCallback={handleFooterClick}
                                                                closeCallback={handleFooterCloseClick}
                                                            />}
                                                    </AddTitleCardContainer>
                                                )}
                                            </CardWrapper>
                                        </CardContainer>
                                    );
                                }}
                            </Droppable>
                            {!clickFooter && (
                                <FooterButton onClick={() => {
                                    if(!isMember) return
                                    setClickFooter(true)}
                                }
                                >
                                    <AddIcon fontSize='small'/>
                                    <Span>Add a card</Span>
                                </FooterButton>
                            )}
                        </Container>
                    );
                }}
            </Draggable>
        </>
    );
};

export default List;
