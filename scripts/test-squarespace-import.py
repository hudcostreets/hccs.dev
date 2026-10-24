#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["beautifulsoup4", "click"]
# ///
"""Verify extraction boundaries and preservation of authored content without network calls."""

import json
from pathlib import Path
from runpy import run_path
from tempfile import TemporaryDirectory
from unittest import TestCase, main

from click.testing import CliRunner

api = run_path(str(Path(__file__).with_name('squarespace-import.py')))
clean_html = api['clean_html']


class ImportTests(TestCase):
    def test_removes_runtime_and_preserves_semantic_copy(self) -> None:
        actual = clean_html('<div class="sq"><!-- editorial note --><h1 style="color:red">Campaign</h1><p onclick="track()">Safe <strong>streets</strong>.</p><script>alert(1)</script><iframe src="https://example.com"></iframe><form><input name="email"/></form></div>')
        self.assertEqual(actual, '<h2>Campaign</h2><p>Safe <strong>streets</strong>.</p>')

    def test_resolves_links_against_the_page(self) -> None:
        actual = clean_html('<a href="#goals">Goals</a><a href="/hblr/action?source=test&amp;x=1">Write</a>', 'https://hudcostreets.org/hblr')
        self.assertEqual(actual, '<a href="https://hudcostreets.org/hblr#goals">Goals</a><a href="https://hudcostreets.org/hblr/action?source=test&amp;x=1">Write</a>')

    def test_removes_unsafe_link_schemes(self) -> None:
        self.assertEqual(clean_html('<a href="javascript:alert(1)">Click</a>'), '<a>Click</a>')

    def test_icon_links_keep_accessible_names(self) -> None:
        self.assertEqual(clean_html('<a href="https://instagram.com/bikehoboken"><i class="fab fa-instagram"></i></a>'), '<a href="https://instagram.com/bikehoboken">instagram.com/bikehoboken</a>')

    def test_capture_preserves_authored_pages_unless_forced(self) -> None:
        scratch = Path(__file__).resolve().parents[1] / 'tmp'
        scratch.mkdir(exist_ok=True)
        with TemporaryDirectory(dir=scratch) as directory:
            root = Path(directory)
            cache = root / 'cache'
            cache.mkdir()
            (cache / 'hblr.html').write_text('<html><head><title>Light Rail — HCCS</title></head><body><main><div class="sqs-block"><div class="sqs-html-content"><p>Original copy.</p></div></div><div class="sqs-block sqs-block-form" id="signup"><form><input/></form></div></main></body></html>')
            output = root / 'org'
            args = ['capture', '-c', str(cache), '-o', str(output), '/hblr']
            runner = CliRunner()
            result = runner.invoke(api['cli'], args)
            self.assertEqual(result.exit_code, 0, result.output)
            page_file = output / 'content/pages/hblr.json'
            expected = {
                'path': '/hblr',
                'title': 'Light Rail',
                'description': '',
                'source': 'https://hudcostreets.org/hblr',
                'blocks': [
                    {'type': 'html', 'html': '<p>Original copy.</p>'},
                    {'type': 'link', 'label': 'Continue on hudcostreets.org', 'href': 'https://hudcostreets.org/hblr'},
                ],
                'review': [{'id': 'signup', 'kind': 'interactive-embed'}],
                'sourceImages': [],
            }
            self.assertEqual(json.loads(page_file.read_text()), expected)
            authored = json.dumps({'blocks': ['Hand-edited copy']}) + '\n'
            page_file.write_text(authored)
            self.assertEqual(runner.invoke(api['cli'], args).exit_code, 0)
            self.assertEqual(page_file.read_text(), authored)
            self.assertEqual(runner.invoke(api['cli'], ['capture', '--force', *args[1:]]).exit_code, 0)
            self.assertEqual(json.loads(page_file.read_text()), expected)


if __name__ == '__main__':
    main()
