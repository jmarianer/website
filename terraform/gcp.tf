provider "google" {
  project = "prefab-conquest-186122"
}

resource "google_compute_global_address" "joeym-org-ip" {
  name = "joeym-org-ip"
}

resource "google_compute_global_forwarding_rule" "forwarding-rule" {
  name = "joeym-org-http"
  target = google_compute_target_http_proxy.http-proxy.self_link
  ip_address = google_compute_global_address.joeym-org-ip.self_link
  ip_protocol = "TCP"
  port_range = "80"
}

resource "google_compute_target_http_proxy" "http-proxy" {
  name    = "joeym-org-http"
  url_map = google_compute_url_map.http-redirect-map.id
}

resource "google_compute_url_map" "http-redirect-map" {
  name = "joeym-org-http-redirect"

  default_url_redirect {
    https_redirect = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query = true
  }
}

resource "google_compute_global_forwarding_rule" "forwarding-rule-https" {
  name = "joeym-org-https"
  target = google_compute_target_https_proxy.https-proxy.self_link
  ip_address = google_compute_global_address.joeym-org-ip.self_link
  ip_protocol = "TCP"
  port_range = "443"
}

resource "google_compute_target_https_proxy" "https-proxy" {
  name    = "joeym-org"
  url_map = google_compute_url_map.url-map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
}

resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  name = "joeym-org-cert"

  managed {
    domains = ["joeym.org", "crosswords.joeym.org", "combinators.joeym.org"]
  }
}

resource "google_compute_url_map" "url-map" {
  name            = "joeym-org"
  default_service = google_compute_backend_bucket.backend-bucket.id

  host_rule {
    hosts        = ["joeym.org"]
    path_matcher = "allpaths"
  }

  host_rule {
    hosts        = ["crosswords.joeym.org"]
    path_matcher = "crosswords"
  }

  host_rule {
    hosts        = ["combinators.joeym.org"]
    path_matcher = "combinators"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_bucket.backend-bucket.id

    path_rule {
      paths = ["/resume"]
      url_redirect {
        host_redirect = "docs.google.com"
        https_redirect = true
        path_redirect = "/document/d/e/2PACX-1vTULD7-CDdmj6nHF3EhLIUp9rq-od86fiPu2KZdYVgoDbdWKVkysvhwF-AqSkGGot-LCXY3tEITFi9R/pub"
        strip_query = true
      }
    }
  }

  path_matcher {
    name            = "crosswords"
    default_service = google_compute_backend_bucket.crosswords-backend-bucket.id
  }

  path_matcher {
    name            = "combinators"
    default_service = google_compute_backend_bucket.combinators-backend-bucket.id
  }
}

resource "google_compute_backend_bucket" "backend-bucket" {
  name        = "joeym-org"
  bucket_name = google_storage_bucket.bucket.name
  enable_cdn  = true
}

resource "google_compute_backend_bucket" "crosswords-backend-bucket" {
  name        = "crosswords-joeym-org"
  bucket_name = google_storage_bucket.crosswords_bucket.name
  enable_cdn  = true
}

resource "google_compute_backend_bucket" "combinators-backend-bucket" {
  name        = "combinators-joeym-org"
  bucket_name = google_storage_bucket.combinators-bucket.name
  enable_cdn  = true
}

resource "google_storage_bucket" "bucket" {
  name = "joeym-org-main-website"
  location = "US"
}

resource "google_storage_bucket" "crosswords_bucket" {
  name = "crosswords-joeym-org"
  location = "US"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
}

resource "google_storage_bucket" "combinators-bucket" {
  name = "combinators-joeym-org"
  location = "US"

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
}
