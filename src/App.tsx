import React, { useState, useRef } from "react";
import { DefaultProvider, SensiletSigner, toHex, sha256, toByteString } from "scrypt-ts";
import { Helloworld } from "./contracts/helloworld";
import './App.css';
var artifact = require('../artifacts/helloworld.json');

function App() {
  const signerRef = useRef<SensiletSigner>();
  const [isConnected, setConnected] = useState(false);
  const [userPubkey, setUserPubkey] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [bsvAddress, setBsvAddress] = useState("");
  const [satoshis, setSatoshis] = useState(0);
  const [message, setMessage] = useState("");
  const [deployedTxId, setDeployedTxId] = useState<string>("")
  const [contract, setContract] = useState<Helloworld | undefined>(undefined)

  const sensiletLogin = async () => {
    try {
      const provider = new DefaultProvider();
      const signer = new SensiletSigner(provider);
      signerRef.current = signer;

      const { isAuthenticated, error } = await signer.requestAuth();
      if (!isAuthenticated) {
        throw new Error(error);
      }

      setConnected(true);

      const userPubkey = await signer.getDefaultPubKey();
      setUserPubkey(toHex(userPubkey));

      signer.getBalance().then((balance) => {
        // UTXOs belonging to transactions in the mempool are unconfirmed
        setUserBalance(balance.confirmed + balance.unconfirmed);
      });

      // Prompt user to switch accounts
    } catch (error) {
      console.error("sensiletLogin failed", error);
      alert("sensiletLogin failed");
    }
  };

  const handleDeploy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(bsvAddress, satoshis, message);
    // code to deploy the information

      if (!isConnected) {
        setConnected(false)
        alert("Please connect wallet first.")
        return
      }

      try {
        const signer = signerRef.current as SensiletSigner;

        Helloworld.loadArtifact(artifact)

        const contractMessage = toByteString(message, true)

        const instance = new Helloworld(sha256(contractMessage))

        await instance.connect(signer);

        const tx = await instance.deploy(satoshis);

        setDeployedTxId(tx.id)

        setContract(instance)

      } catch (e) {
        console.error('deploy Helloworld fails', e)
        alert('deploy Helloworld fails')
      }

  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Secret Sats</h1>
        {isConnected ? (
          <div className="form-container">
            <div className="balance-container">
              <label className="balance-label">Balance:</label>
              <span className="balance-amount">{userBalance} <span className="balance-unit">satoshis</span></span>
            </div>
            <form onSubmit={handleDeploy} className="deploy-form">
              <div className="form-group">
                <label htmlFor="satoshis" className="form-label">
                  Satoshis:
                </label>
                <input
                  type="number"
                  id="satoshis"
                  value={satoshis}
                  onChange={(event) => setSatoshis(Number(event.target.value))}
                  className="form-input balance-input"
                  title="Enter the amount of satoshis you want to lock behind the message"
                />
              </div>
              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message:
                </label>
                <input
                  type="text"
                  id="message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="form-input"
                  title="Enter the message you want to lock the satoshis behind"
                />
              </div>
              <button type="submit" className="form-button" disabled={!satoshis || !message}>Deploy</button>
            </form>
          </div>
        ) : (
          <button
            className="form-button"
            onClick={sensiletLogin}
          >
            Connect Wallet
          </button>
        )}
      </header>
    </div>
  );
}

export default App;