## Usage

```yml
jobs:
  proxies-health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: dongchengjie/proxies-health-check@main
        with:
          proxies_config_urls: |
            https://example.com/subs1.yaml
            https://example.com/subs2.yaml
          timeout: 2000
          proxies: custom_folder/custom_file.yaml
```

## Input parameters

| Input                        | Description                                                                          | Default                             |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| proxies_config_urls          | Proxies configuration URLs                                                           |                                     |
| segment_size                 | Segment size for health check                                                        | 100                                 |
| concurrency                  | Number of concurrent health check requests                                           | CPU logical cores \* 2              |
| test_url                     | URL used for health check                                                            | https://www.google.com/generate_204 |
| timeout                      | Timeout for each health check request in milliseconds                                | 1500                                |
| excluded_proxies_config_urls | Proxies configuration URLs to be excluded                                            |                                     |
| max_excluded_times           | Maximum number of times a proxy can be excluded before being removed from the output | 3                                   |
| qualified                    | Output file path for qualified proxies                                               | $pwd/qualified.yaml                 |
| excluded                     | Output file path for excluded proxies                                                | $pwd/excluded.yaml                  |
