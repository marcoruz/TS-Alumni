import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function LoginGoogle() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem('dataKey');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setUserData(parsedData);
        navigate(parsedData.isNewUser ? "/newacc" : "/newsfeed");
      } catch (error) {
        console.error("Fehler beim Parsen der Benutzerdaten aus dem Local Storage:", error);
        // Optionale Weiterleitung zum Login oder Anzeige einer Fehlermeldung
      }
    } else {
      console.log("Keine Benutzerdaten im Local Storage gefunden.");
      // Optionale Weiterleitung zum Login oder Anzeige einer Meldung
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
      );
      const data = await response.json();
      console.log("Google Data:", data);
  
      const extractedData = {
        email: data.email,
        username: data.given_name, // Assuming 'given_name' represents the username
        realName: data.name,
      };
  
      console.log("Extracted Data:", extractedData);
      localStorage.setItem('userDataKey', JSON.stringify(extractedData));
      console.log("Benutzerdaten im Local Storage gespeichert:", localStorage.getItem('userDataKey'));
  
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

      if (!response.ok) {
        throw new Error(`Serverantwort war nicht OK. Status: ${response.status}`);
      }

      const responseText = await response.text();

      if (!responseText) {
        throw new Error('Leere Antwort vom Server erhalten');
      }

      let responseFetch;
      try {
        responseFetch = JSON.parse(responseText);
      } catch (error) {
        throw new Error('Antwort ist kein gültiges JSON: ' + error.message);
      }

      console.log("responseData from googlefetch", responseFetch);
      if (!responseFetch || !responseFetch.accessToken) {
        throw new Error('Keine gültigen Daten in der Antwort vom Server');
      }

      // Weiterer Code zur Verarbeitung von responseFetch
      // ...

    } catch (error) {
      console.error("Fehler beim Senden der Daten an das Backend oder beim Parsen der Antwort:", error);
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
