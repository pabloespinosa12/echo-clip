{
  "targets": [
    {
      "target_name": "clipboard",
      "sources": [
        "src/addon.cpp"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "conditions": [
        ["OS=='win'", {
          "sources": ["src/clipboard.cpp"]
        }],
        ["OS=='mac'", {
          "sources": ["src/clipboard_mac.mm"],
          "link_settings": {
            "libraries": [
              "-framework Foundation",
              "-framework AppKit"
            ]
          }
        }]
      ]
    }
  ]
}