## Usage

```yml
jobs:
  proxies-health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: dongchengjie/proxies-health-check@main
        with:
          proxies-config-urls: |
            https://example.com/subs1.yaml
            https://example.com/subs2.yaml
          timeout: 2000
          proxies: custom_folder/custom_file.yaml
```

## Input

| Input                        | Description                                                                          | Default                             |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| proxies-config-urls          | Proxies configuration URLs                                                           |                                     |
| segment-size                 | Segment size for health check                                                        | 100                                 |
| concurrency                  | Number of concurrent health check requests                                           | CPU logical cores \* 2              |
| test-url                     | URL used for health check                                                            | https://www.google.com/generate_204 |
| timeout                      | Timeout for each health check request in milliseconds                                | 1500                                |
| excluded-proxies-config-urls | Proxies configuration URLs to be excluded                                            |                                     |
| max-excluded-times           | Maximum number of times a proxy can be excluded before being removed from the output | 3                                   |
| qualified                    | Output file path for qualified proxies                                               | $pwd/qualified.yaml                 |
| excluded                     | Output file path for excluded proxies                                                | $pwd/excluded.yaml                  |
| statistics                   | Output file path for statistics                                                      | $pwd/statistics.md                  |
