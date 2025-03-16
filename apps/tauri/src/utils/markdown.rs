use pulldown_cmark::{CodeBlockKind, Event, Options, Parser, Tag, TagEnd};
use std::{path::Path, sync::LazyLock};
use syntect::{
    highlighting::Theme, highlighting::ThemeSet, html::highlighted_html_for_string,
    parsing::SyntaxSet,
};

/// Converts markdown text to HTML with syntax highlighting for code blocks
///
/// This function parses markdown and converts it to HTML, applying syntax
/// highlighting to code blocks based on the specified language.
/// It uses the Everforest Dark theme for syntax highlighting.
/// Also supports LaTeX-style math via the math extension.
///
/// # Arguments
///
/// * `markdown` - The markdown string to convert to HTML
///
/// # Returns
///
/// A String containing the HTML representation of the markdown
pub fn markdown_to_html(markdown: &str) -> String {
    static SYNTAX_SET: LazyLock<SyntaxSet> = LazyLock::new(SyntaxSet::load_defaults_newlines);
    static THEME: LazyLock<Theme> = LazyLock::new(|| {
        let mut theme_cursor = std::io::Cursor::new(include_bytes!("Everforest Dark.tmTheme"));
        let loaded_theme = ThemeSet::load_from_reader(&mut theme_cursor)
            .expect("Failed to load theme from cursor");
        loaded_theme.clone()
    });

    if let Some(syntax) = SYNTAX_SET.find_syntax_by_token("tsx") {
        println!("Found TSX syntax: {}", syntax.name);
    } else {
        println!("No TSX syntax found.");
    }

    let mut sr = SYNTAX_SET.find_syntax_plain_text();
    let mut code = String::new();
    let mut code_block = false;

    // Enable math extension
    let options = Options::empty().union(Options::ENABLE_GFM);

    let parser = Parser::new_ext(markdown, options).filter_map(|event| match event {
        Event::Start(Tag::CodeBlock(CodeBlockKind::Fenced(lang))) => {
            let lang = lang.trim();
            let normalized_lang = if lang.eq_ignore_ascii_case("csharp") {
                "C#"
            } else {
                lang
            };
            sr = SYNTAX_SET
                .find_syntax_by_token(normalized_lang)
                .unwrap_or_else(|| SYNTAX_SET.find_syntax_plain_text());
            code_block = true;
            None
        }
        Event::End(TagEnd::CodeBlock) => {
            let html = highlighted_html_for_string(&code, &SYNTAX_SET, &sr, &THEME)
                .unwrap_or(code.clone());
            code.clear();
            code_block = false;
            Some(Event::Html(html.into()))
        }
        Event::Text(t) => {
            if code_block {
                code.push_str(&t);
                return None;
            }
            Some(Event::Text(t))
        }
        _ => Some(event),
    });
    let mut html_output = String::new();
    pulldown_cmark::html::push_html(&mut html_output, parser);
    html_output
}
