import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function LoginGoogle() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('dataKey'));
    if (storedData) {
      setUserData(storedData);
      navigate(storedData.isNewUser ? "/newacc" : "/newsfeed");
    }
  }, []);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('dataKey'));
    if (storedData) {
      setUserData(storedData);
      navigate(storedData.isNewUser ? "/newacc" : "/newsfeed");
    }
  }, []);

  const fetchGoogleUserData = async (accessToken) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log("Google Data:", data);
  
      const extractedData = {
        email: data.email,
        username: data.given_name, // Assuming 'given_name' represents the username
        realName: data.name,
      };
  
      console.log("Extracted Data:", extractedData);
      return extractedData;
    } catch (error) {
      console.error("Error fetching Google user data.", error);
      return null;
    }
  };
  

  const sendDataToBackend = async (googleData, accessToken) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://845d97vw4k.execute-api.eu-central-1.amazonaws.com/login/googlefetch', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: accessToken })
      });
  
      const responseFetch = await response.json();
      console.log("responseData from googlefetch", responseFetch);
      localStorage.setItem('userDataKey', JSON.stringify(googleData));
  
      // Store email, username, and real name in local storage
      localStorage.setItem('email', googleData.email);
      localStorage.setItem('username', googleData.username);
      localStorage.setItem('realName', googleData.realName);
  
      const responseToBackend = await fetch(
        "https://845d97vw4k.execute-api.eu-central-1.amazonaws.com/login/google",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: responseFetch.accessToken,
            email: responseFetch.email,
            username: responseFetch.username,
            realName: responseFetch.realName,
          }),
        }
      );
  
      const responseData = await responseToBackend.json();
      console.log("data From backend login google", responseData)
  
      setUserData(responseData);
      var sessionData = responseData.sessionData;
      localStorage.setItem("Session", sessionData);
  
      if (responseData.isNewUser === false) {
        var existingUserMessage = JSON.parse(responseData.steps.existingUserMessage);
        var userID = existingUserMessage[0].UserID;
        localStorage.setItem("UserID", userID);
      }
      else {
        var data = JSON.parse(responseData.user);
        var userID = data[0][0].UserID;
        console.log("userID ", userID)
        console.log("userID ", userID)
        localStorage.setItem("UserID", userID);
      }
  
      localStorage.setItem('dataKey', JSON.stringify(responseData)); // Daten speichern
  
      if (responseData.isNewUser === false) {
        navigate("/newsfeed");
      } else {
        navigate("/newacc");
      }
  
    } catch (error) {
      console.error("Fehler beim Senden der Daten an das Backend.", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let queryParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = queryParams.get("access_token");
    if (accessToken) {
      fetchGoogleUserData(accessToken).then((googleData) => {
        if (googleData) {
          sendDataToBackend(googleData, accessToken);
        }
      });
    }
  }, []);

  if (isLoading) {
    return <div>Lädt...</div>;
  }

  if (!userData || !userData.email) {
    return (
      <div>
        <p>Keine Benutzerdaten vorhanden. Bitte loggen Sie sich ein.</p>
      </div>
    );
  }

  return null;
}

export default LoginGoogle;
