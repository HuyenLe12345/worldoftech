import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import UserAPI from "../API/UserAPI";
import { addSession } from "../Redux/Action/ActionSession";
import "./Auth.css";
import queryString from "query-string";
import CartAPI from "../API/CartAPI";

function SignIn(props) {
  //listCart được lấy từ redux
  const listCart = useSelector((state) => state.Cart.listCart);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  // const [user, setUser] = useState([]);

  const [errorEmail, setErrorEmail] = useState(false);
  const [emailRegex, setEmailRegex] = useState(false);
  const [errorPassword, setErrorPassword] = useState(false);
  const [error, setError] = useState(null);

  const [redirect, setRedirect] = useState(false);

  const [checkPush, setCheckPush] = useState(false);

  const dispatch = useDispatch();
  // Function to check if session is expired
  const isSessionExpired = () => {
    const expirationTime = localStorage.getItem("expiration_time");
    return expirationTime && Date.now() > Number(expirationTime);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("id_user");
    localStorage.removeItem("name_user");
    localStorage.removeItem("expiration_time"); // Clear expiration time
  };
  useEffect(() => {
    if (isSessionExpired()) {
      handleLogout();
    }
  }, []);
  const onChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const onSubmit = () => {
    if (!email) {
      setErrorEmail(true);
      return;
    } else {
      if (!password) {
        setErrorEmail(false);
        setErrorPassword(true);
        return;
      } else {
        setErrorPassword(false);

        if (!validateEmail(email)) {
          setEmailRegex(true);
          return;
        } else {
          setEmailRegex(false);
          console.log("PASS");
          const fetchLogin = async () => {
            const params = {
              email: email,
              password: password,
            };
            console.log("PARAMS", params);
            const query = "?" + queryString.stringify(params);
            const response = await UserAPI.postLogin(query);
            console.log("response", response);
            if (response && response.error) {
              const err = response.error;
              if (err.path === "email") {
                setErrorEmail(true);
                setErrorPassword(false);
                setError(err.message);
              } else if (err.path === "password") {
                setErrorEmail(false);
                setErrorPassword(true);
                setError(err.message);
              }
            }
            if (response && response.message === "Success") {
              const user = response.user;
              // setUser(user);
              setErrorEmail(false);
              setErrorPassword(false);
              setError(null);
              localStorage.setItem("id_user", user._id);
              localStorage.setItem("token", user.token);
              localStorage.setItem("name_user", user.fullname);

              // Set expiration time for the session
              const expirationTime = Date.now() + 1 * 60 * 60 * 1000; // 1 hour from now
              localStorage.setItem("expiration_time", expirationTime);
              const action = addSession(localStorage.getItem("id_user"));

              dispatch(action);
              // Clear local storage after expiration
              setTimeout(() => {
                handleLogout();
              }, 1 * 60 * 60 * 1000); // 1 hour

              return;
            }
          };
          fetchLogin();
        }
      }
    }
  };

  //Hàm này dùng để đưa hết tất cả carts vào API của user
  useEffect(() => {
    const fetchData = async () => {
      //Lần đầu sẽ không thực hiện insert được vì addCart = ''
      if (checkPush === true) {
        for (let i = 0; i < listCart.length; i++) {
          //Nó sẽ lấy idUser và idProduct và count cần thêm để gửi lên server
          const params = {
            idUser: localStorage.getItem("id_user"),
            _id: listCart[i]._id,
            quantity: listCart[i].quantity,
          };

          const query = "?" + queryString.stringify(params);

          const response = await CartAPI.postAddToCart(query);
          console.log(response);
        }
        console.log("move to HOme");
        setRedirect(true);
      }
    };

    fetchData();
  }, [checkPush]);

  function validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  return (
    <div className="limiter">
      <div className="container-login100">
        <div className="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-50">
          <span className="login100-form-title p-b-33">Sign In</span>

          <div className="d-flex justify-content-center pb-5">
            {emailRegex && (
              <span className="text-danger">
                {error || "* Incorrect Email Format"}
              </span>
            )}
            {errorEmail && (
              <span className="text-danger">
                {error || "* Please Check Your Email"}
              </span>
            )}
            {errorPassword && (
              <span className="text-danger">
                {error || "* Please Check Your Password"}
              </span>
            )}
          </div>

          <div className="wrap-input100 validate-input">
            <input
              className="input100"
              type="text"
              placeholder="Email"
              value={email}
              onChange={onChangeEmail}
            />
          </div>

          <div className="wrap-input100 rs1 validate-input">
            <input
              className="input100"
              type="password"
              placeholder="Password"
              value={password}
              onChange={onChangePassword}
            />
          </div>

          <div className="container-login100-form-btn m-t-20">
            {redirect && <Redirect to="/" />}
            <button className="login100-form-btn" onClick={onSubmit}>
              Sign in
            </button>
          </div>

          <div className="text-center p-t-45 p-b-4">
            <span className="txt1">Create an account?</span>
            &nbsp;
            <Link to="/signup" className="txt2 hov1">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
