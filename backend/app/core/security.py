"""Ed25519 key management for Verifiable Credential signing.

Keys are generated on first run if absent (dev convenience). In production the
private key must come from a secrets manager / KMS in af-south-1, never from a
file committed to source control.
"""

from __future__ import annotations

import base64
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

from app.core.config import settings


def _ensure_key_dir(path: str) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def generate_keypair() -> None:
    """Generate an Ed25519 keypair and persist as PEM if not present."""
    priv_path = _ensure_key_dir(settings.ed25519_private_key_path)
    pub_path = _ensure_key_dir(settings.ed25519_public_key_path)

    if priv_path.exists() and pub_path.exists():
        return

    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    priv_path.write_bytes(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    pub_path.write_bytes(
        public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )


def get_private_key() -> ed25519.Ed25519PrivateKey:
    generate_keypair()
    data = Path(settings.ed25519_private_key_path).read_bytes()
    key = serialization.load_pem_private_key(data, password=None)
    assert isinstance(key, ed25519.Ed25519PrivateKey)
    return key


def get_public_key() -> ed25519.Ed25519PublicKey:
    generate_keypair()
    data = Path(settings.ed25519_public_key_path).read_bytes()
    key = serialization.load_pem_public_key(data)
    assert isinstance(key, ed25519.Ed25519PublicKey)
    return key


def public_key_multibase() -> str:
    """Return the raw public key as base64url (for the DID verification method)."""
    raw = get_public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
