import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { exampleRequest, usersExampleRequest } from "./services/api.service";

function App() {
  const [count, setCount] = useState(0);
  const [response, setResponse] = useState(null);
  const [users, setUsers] = useState<{ id: number }[]>([]);

  useEffect(() => {
    (async () => {
      const response = await exampleRequest();
      setResponse(response);
    })();

    (async () => {
      const users = await usersExampleRequest();
      setResponse(users);
    })();
  }, []);

  return (
    <>
      <div>
        <p>Example API Response: {response}</p>
        <p>Example db request for users: </p>
        {users.map((user) => (
          <p>id: {user.id}</p>
        ))}

        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
