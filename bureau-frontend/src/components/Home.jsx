import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div
      className="d-flex justify-content-center align-items-center bg-light"
      style={{ height: "100vh", width: "100vw", margin: 0 }}
    >
      <div
        className="card shadow p-5 text-center"
        style={{
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <h1 className="mb-4 text-primary fw-bold">Bureau d'ordre</h1>
        <p className="mb-4 text-muted">choisissez le registre pour commencer</p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/arrivee" className="btn btn-success btn-lg">
            Registre d'arrivee
          </Link>
          <Link to="/depart" className="btn btn-primary btn-lg">
            Registre de depart
          </Link>
        </div>
      </div>
    </div>
  );
}
