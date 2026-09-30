"""Dependency-free checks before loading models or allocating GPU memory."""

import argparse
import json
from pathlib import Path


def validate_pair(train, validation, vision=False):
    splits = []
    for filename in (train, validation):
        rows, ids, groups, conversations, prompts = [], set(), set(), set(), set()
        for number, line in enumerate(Path(filename).read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            location = f"{filename}:{number}"
            try:
                row = json.loads(line)
                identifier = row["id"]
                if not isinstance(identifier, str) or not identifier.strip() or identifier in ids:
                    raise ValueError("missing or duplicate id")
                group = row.get("group", identifier)
                if not isinstance(group, str) or not group.strip():
                    raise ValueError("invalid split group")
                messages = row["messages"]
                if not isinstance(messages, list) or len(messages) < 2:
                    raise ValueError("conversation needs a user and assistant")
                roles, images = [], 0
                for message in messages:
                    role, content = message["role"], message["content"]
                    roles.append(role)
                    if isinstance(content, str):
                        if not content.strip():
                            raise ValueError("empty message")
                    elif vision and isinstance(content, list) and content:
                        for part in content:
                            if part.get("type") == "image" and role == "user":
                                if not Path(part["image"]).is_file():
                                    raise ValueError(f"image missing: {part['image']}")
                                images += 1
                            elif part.get("type") == "text" and isinstance(part.get("text"), str) and part["text"].strip():
                                pass
                            else:
                                raise ValueError("invalid content part")
                    else:
                        raise ValueError("invalid message content")
                conversation_roles = roles[1:] if roles[0] == "system" else roles
                if conversation_roles != ["user", "assistant"] * (len(conversation_roles) // 2):
                    raise ValueError("roles must alternate user/assistant and end with assistant")
                if vision and not images:
                    raise ValueError("vision conversation has no image")
                signature = json.dumps(messages, ensure_ascii=False, sort_keys=True)
                if signature in conversations:
                    raise ValueError("duplicate conversation")
                ids.add(identifier)
                groups.add(group)
                conversations.add(signature)
                prompts.add(json.dumps(messages[:-1], ensure_ascii=False, sort_keys=True))
                rows.append(row)
            except (KeyError, TypeError, ValueError, AttributeError) as error:
                raise ValueError(f"{location}: {error}") from error
        if not rows:
            raise ValueError(f"{filename}: dataset is empty")
        splits.append((rows, ids, groups, conversations, prompts))
    for index, label in ((1, "ids"), (2, "groups"), (3, "conversations"), (4, "prompts")):
        if splits[0][index] & splits[1][index]:
            raise ValueError(f"train/validation overlap in {label}")
    return {"train": len(splits[0][0]), "validation": len(splits[1][0])}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", default="training/data/dosha-train.jsonl")
    parser.add_argument("--validation", default="training/data/dosha-validation.jsonl")
    parser.add_argument("--vision", action="store_true")
    args = parser.parse_args()
    try:
        print(json.dumps(validate_pair(args.train, args.validation, args.vision)))
    except (OSError, ValueError) as error:
        parser.exit(1, f"Dataset validation failed: {error}\n")
