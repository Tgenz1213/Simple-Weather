#!/usr/bin/env sh
set -e

# setup-env.sh
# POSIX shell script to create or update .env.local from .env.example

# Ensure .env.example exists
if [ ! -f .env.example ]; then
  echo ".env.example not found — creating a default .env.example"
  cat > .env.example <<'EOF'
ENV_MODE=srh
SRH_MODE=env
SRH_TOKEN=your_token_here
SRH_CONNECTION_STRING=redis://localhost:6379
SRH_PORT=8080
EMAIL=your_email@example.com
VITE_EMAIL=your_email@example.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
EOF
fi

# Confirm overwrite if .env.local exists
if [ -f .env.local ]; then
  printf ".env.local already exists. Overwrite? (y/N): "
  read -r ans
  if [ "$ans" != "y" ]; then
    echo "Keeping existing .env.local"
    exit 0
  fi
fi

cp .env.example .env.local

# Prompt for ENV_MODE
printf "Choose ENV_MODE (srh/upstash) [srh]: "
read -r mode
if [ -n "$mode" ]; then
  awk -v m="$mode" 'BEGIN{FS=OFS="="} $1=="ENV_MODE"{$2=m} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
fi

# Reload values
set -a
. ./.env.local
set +a

mode=$(echo "${ENV_MODE:-srh}" | tr '[:upper:]' '[:lower:]')

if [ "$mode" = "upstash" ]; then
  echo "ENV_MODE=upstash selected. Please enter Upstash values."
  printf "Enter UPSTASH_REDIS_REST_URL (leave empty to keep placeholder or existing value): "
  read -r upr
  if [ -n "$upr" ]; then
    awk -v v="$upr" 'BEGIN{FS=OFS="="} $1=="UPSTASH_REDIS_REST_URL"{$2=v} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
  fi

  printf "Enter UPSTASH_REDIS_REST_TOKEN (leave empty to keep placeholder or existing value): "
  read -r upt
  if [ -n "$upt" ]; then
    awk -v v="$upt" 'BEGIN{FS=OFS="="} $1=="UPSTASH_REDIS_REST_TOKEN"{$2=v} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
  fi

  # Prompt for a contact/email to include in headers or metadata
  printf "Enter EMAIL (leave empty to keep placeholder or existing value): "
  read -r email
  if [ -n "$email" ]; then
    awk -v e="$email" 'BEGIN{FS=OFS="="} $1=="EMAIL"{$2=e} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    if ! grep -q '^VITE_EMAIL=' .env.local; then
      echo "VITE_EMAIL=$email" >> .env.local
    else
      awk -v e="$email" 'BEGIN{FS=OFS="="} $1=="VITE_EMAIL"{$2=e} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    fi
  fi
else
  echo "ENV_MODE=${mode} selected. Please enter SRH values."
  printf "Enter SRH_TOKEN (leave empty to keep placeholder or existing value): "
  read -r token
  if [ -n "$token" ]; then
    awk -v tok="$token" 'BEGIN{FS=OFS="="} $1=="SRH_TOKEN"{$2=tok} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
  fi

  printf "Enter SRH_CONNECTION_STRING (leave empty to keep placeholder or existing value): "
  read -r conn
  if [ -n "$conn" ]; then
    awk -v con="$conn" 'BEGIN{FS=OFS="="} $1=="SRH_CONNECTION_STRING"{$2=con} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
  fi

  # Prompt for a contact/email to include in headers or metadata
  printf "Enter EMAIL (leave empty to keep placeholder or existing value): "
  read email
  if [ -n "$email" ]; then
    awk -v e="$email" 'BEGIN{FS=OFS="="} $1=="EMAIL"{$2=e} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    if ! grep -q '^VITE_EMAIL=' .env.local; then
      echo "VITE_EMAIL=$email" >> .env.local
    else
      awk -v e="$email" 'BEGIN{FS=OFS="="} $1=="VITE_EMAIL"{$2=e} {print}' .env.local > .env.local.tmp && mv .env.local.tmp .env.local
    fi
  fi
fi

echo ".env.local created/updated. Preview (sensitive values redacted):"
awk 'BEGIN{count=0}
{ if(count>=20) exit
  line=$0
  if (line ~ /^[[:space:]]*$/ || line ~ /^[[:space:]]*#/) { print line; count++; next }
  split(line,a,"=")
  key=a[1]
  ku=key
  gsub(/^[ \t]+|[ \t]+$/,"",ku)
  ku=toupper(ku)
  if (ku ~ /(TOKEN|CONNECTION_STRING|REST_TOKEN|URL|PASSWORD|SECRET|KEY)/) {
    print key"=[REDACTED]"
  } else {
    print line
  }
  count++
}' .env.local
exit 0
