import json
import tempfile
import unittest
from pathlib import Path
from validate_data import validate_pair


class DatasetChecks(unittest.TestCase):
    def check_pair(self, train, validation, vision=False):
        with tempfile.TemporaryDirectory() as directory:
            paths = [Path(directory) / name for name in ('train.jsonl', 'validation.jsonl')]
            for path, rows in zip(paths, (train, validation)):
                path.write_text(''.join(json.dumps(row) + '\n' for row in rows), encoding='utf-8')
            return validate_pair(*paths, vision=vision)

    def row(self, identifier, question='Сәлем!'):
        return {'id': identifier, 'messages': [
            {'role': 'user', 'content': question},
            {'role': 'assistant', 'content': 'Сәлем! Қазақ тілін бірге үйренейік.'}]}

    def test_valid(self):
        self.assertEqual(self.check_pair([self.row('a')], [self.row('b', 'Қалайсың?')]),
                         {'train': 1, 'validation': 1})

    def test_leaked_conversation(self):
        with self.assertRaisesRegex(ValueError, 'overlap in conversations'):
            self.check_pair([self.row('a')], [self.row('b')])

    def test_duplicate_conversation_inside_split(self):
        with self.assertRaisesRegex(ValueError, 'duplicate conversation'):
            self.check_pair([self.row('a'), self.row('b')], [self.row('c', 'Different')])

    def test_same_prompt_different_answers_across_splits(self):
        first, second = self.row('a'), self.row('b')
        second['messages'][-1]['content'] = 'Another valid answer'
        with self.assertRaisesRegex(ValueError, 'overlap in prompts'):
            self.check_pair([first], [second])

    def test_invalid_vision_part(self):
        row = self.row('a')
        row['messages'][0]['content'] = ['not a content object']
        with self.assertRaisesRegex(ValueError, 'train.jsonl:1'):
            self.check_pair([row], [self.row('b')], vision=True)

    def test_leaked_group(self):
        a, b = self.row('a'), self.row('b', 'Қалайсың?')
        a['group'] = b['group'] = 'shared'
        with self.assertRaisesRegex(ValueError, 'overlap in groups'):
            self.check_pair([a], [b])

    def test_empty(self):
        with self.assertRaisesRegex(ValueError, 'empty'):
            self.check_pair([], [self.row('b')])

    def test_roles(self):
        row = self.row('a')
        row['messages'].reverse()
        with self.assertRaisesRegex(ValueError, 'roles must alternate'):
            self.check_pair([row], [self.row('b')])

    def test_missing_vision_image(self):
        row = self.row('a')
        row['messages'][0]['content'] = [{'type': 'image', 'image': '/missing/example.png'}]
        with self.assertRaisesRegex(ValueError, 'image missing'):
            self.check_pair([row], [self.row('b')], vision=True)


if __name__ == '__main__':
    unittest.main()
