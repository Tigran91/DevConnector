import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import rootReducer from "./reducers";

const initialState = {};

const middleware = [thunk];
//
let composeStore;

//
if (process.env.NODE_ENV === "production") {
  composeStore = compose(applyMiddleware(...middleware));
} else {
  composeStore = compose(
    applyMiddleware(...middleware),
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );
}

const store = createStore(rootReducer, initialState, composeStore);

export default store;
